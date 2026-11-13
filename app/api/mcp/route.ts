import { registerLegalChatgptApp } from '@/lib/chatgpt-app'
import { boundedMcpRequest } from '@/lib/chatgpt-http'
import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'
import { ToolItem, toStructured, formatTool, type ToolRow } from '@/lib/mcp-results'
import { supabase } from '@/lib/supabase'
import { CATEGORY_LABELS, PRICING_LABELS, SITE_URL } from '@/lib/constants'
import { rankSearchResults, searchTerms } from '@/lib/search'
import { rankListings, pricingSupportNote, FIRM_SIZES, type ScorableListing } from '@/lib/recommend'

/**
 * legalaimcp.com, exposed as an MCP server.
 *
 * WHY THIS EXISTS: the site is a directory *of* MCP servers that shipped no
 * MCP endpoint of its own — MCP is literally in the domain name. That gap is
 * also the whole AEO problem in miniature. An assistant asked "what AI tools
 * exist for legal contract review?" can only summarize a web page it happened
 * to crawl; it cannot ask the directory anything. A page gets skimmed, a tool
 * gets *called*, and called tools get installed, listed in MCP registries, and
 * cited by name.
 *
 * DESIGN: read-only, unauthenticated, and it queries exactly the same
 * published rows the public website renders through the same anon key already
 * shipped to every browser. There is no new data exposure here and no new
 * secret — an MCP client can reach nothing a `curl` of the site could not.
 * Anything write-shaped (submitting a tool) deliberately stays on the human
 * form behind the /admin review queue, because an endpoint that lets an agent
 * inject listings is precisely how the phantom-listing problem would come
 * back, automated.
 *
 * Every tool below returns `verified` WITH `verified_at`, never one without
 * the other. An assistant relaying "this tool is verified" with no date would
 * launder a dated, narrow claim into an open-ended endorsement — the exact
 * failure this directory just spent a cleanup fixing.
 *
 * Each tool returns BOTH renderings of the same rows: formatted text (for
 * clients that surface prose) and `structuredContent` matching its declared
 * `outputSchema` (for agents that consume data). Registry scanners (Smithery)
 * also score on output schemas and behavior annotations — all three tools are
 * annotated read-only/idempotent/closed-world, which is simply true of a
 * directory lookup.
 */

// Shape returned to clients. Kept narrow on purpose: `description` runs to
// 2000 chars and would blow up an assistant's context for a list of 20 tools
// with no benefit — detail lives behind `get_tool`.
const SUMMARY_COLUMNS =
  'slug, name, tagline, category, pricing_model, pricing_details, verified, verified_at, external_url, mcp_repo_url, mcp_install_command, creator_name'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as [string, ...string[]]
const PRICING = Object.keys(PRICING_LABELS) as [string, ...string[]]

// ------------------------------------------------------------- schemas ----

/**
 * Structured shape of one listing, shared by search and get. The verification
 * caveat is baked into the SCHEMA description, not just the prose — an agent
 * reading only structuredContent still sees what "verified" does and doesn't
 * mean.
 */
/**
 * Consistent failure result. isError satisfies the structured-output contract
 * (a declared outputSchema requires structuredContent on success results, but
 * not on errors), and the text tells a human what to do next.
 */
function unavailable() {
  return {
    isError: true,
    content: [
      {
        type: 'text' as const,
        text: `The legalaimcp directory is temporarily unreachable. Browse ${SITE_URL}/servers directly.`,
      },
    ],
  }
}

/**
 * Shared behavior annotations — a directory lookup is the textbook case:
 * reads only, same query → same answer, and it consults our own database
 * rather than the open web (closed world).
 */
const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
}

// ------------------------------------------------------------- handler ----

const handler = createMcpHandler(
  (server) => {
    registerLegalChatgptApp(server)
    server.registerTool(
      'search_legal_ai_tools',
      {
        title: 'Search legal AI tools',
        description:
          'Search the legalaimcp.com directory of AI tools and MCP servers built for law firms. Filter by free-text query, practice-area category, and pricing model. Use this when someone asks what AI tooling exists for legal work such as contract review, legal research, client intake, billing, or compliance.',
        inputSchema: {
          query: z
            .string()
            .max(100)
            .optional()
            .describe('Free-text search over tool names, taglines, and descriptions, e.g. "contract review"'),
          category: z
            .enum(CATEGORIES)
            .optional()
            .describe('Practice-area filter — get slugs from list_legal_ai_categories'),
          pricing: z
            .enum(PRICING)
            .optional()
            .describe('Pricing-model filter: free, freemium, paid, or contact'),
          limit: z
            .number()
            .int()
            .min(1)
            .max(25)
            .default(10)
            .describe('Maximum number of results to return (1–25, default 10)'),
        },
        outputSchema: {
          count: z.number().describe('Number of tools returned'),
          tools: z.array(ToolItem).describe('Matching tools, link-verified listings first'),
        },
        annotations: READ_ONLY,
      },
      async ({ query, category, pricing, limit }) => {
        if (!supabase) return unavailable()

        // Claude Opus, 2026-11-12: with a query, fetch every match (the
        // catalog is about 50 rows; capped at 200) and rank by relevance in
        // lib/search.ts. The old DB-side .limit() ordered only by verified,
        // then featured, so "contract review" returned case-law and
        // receptionist tools ahead of the contract tools. Without a query the
        // old verified-then-featured browse order stays.
        const terms = query ? searchTerms(query) : []
        let q = supabase
          .from('listings')
          .select(terms.length ? `${SUMMARY_COLUMNS}, description, featured` : SUMMARY_COLUMNS)
          .eq('status', 'published')
          .order('verified', { ascending: false })
          .order('featured', { ascending: false })
          .limit(terms.length ? 200 : limit)

        if (category) q = q.eq('category', category)
        if (pricing) q = q.eq('pricing_model', pricing)
        if (terms.length) {
          // Match ANY token across name/tagline/description (recall first:
          // assistants send prose, not keywords), then rank below. Tokens are
          // stripped of PostgREST metacharacters in searchTerms, because an
          // MCP tool argument is attacker-controlled like a query param.
          q = q.or(
            terms
              .flatMap((t) => [`name.ilike.%${t}%`, `tagline.ilike.%${t}%`, `description.ilike.%${t}%`])
              .join(',')
          )
        }

        const { data: matched, error } = await q
        if (error) return unavailable()
        const data = terms.length
          ? rankSearchResults(
              ((matched ?? []) as unknown as ToolRow[]).map((t) => ({
                ...t,
                category_label: CATEGORY_LABELS[t.category as string],
              })),
              terms,
              limit
            ).map((t) => {
              // Keep the response narrow: description and featured were read for ranking only.
              const { description: _d, featured: _f, category_label: _c, ...rest } = t as ToolRow
              return rest as ToolRow
            })
          : ((matched ?? []) as unknown as ToolRow[])

        const structuredContent = {
          count: data?.length ?? 0,
          tools: (data ?? []).map((t) => toStructured(t as ToolRow)),
        }

        const text = !data?.length
          ? `No tools matched. The directory covers ${
              Object.keys(CATEGORY_LABELS).length
            } practice areas — try a broader query or browse ${SITE_URL}/servers.`
          : [
              `Found ${data.length} tool(s) in the legalaimcp.com directory:`,
              '',
              ...data.map((t) => formatTool(t as ToolRow)),
            ].join('\n\n')

        return { content: [{ type: 'text' as const, text }], structuredContent }
      }
    )

    server.registerTool(
      'get_legal_ai_tool',
      {
        title: 'Get one legal AI tool',
        description:
          'Get the full listing for one legal AI tool by its slug, including the complete description and MCP install command. Use after search_legal_ai_tools to go deeper on a specific result.',
        inputSchema: {
          slug: z
            .string()
            .max(100)
            .regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, numbers and hyphens')
            .describe('Listing slug, e.g. "harvey-ai" — taken from a search result'),
        },
        outputSchema: {
          found: z.boolean().describe('False when no published listing has this slug'),
          tool: ToolItem.extend({
            description: z.string().nullable().describe('Full listing description'),
          })
            .optional()
            .describe('The listing, present when found is true'),
        },
        annotations: READ_ONLY,
      },
      async ({ slug }) => {
        if (!supabase) return unavailable()

        const { data, error } = await supabase
          .from('listings')
          .select(`${SUMMARY_COLUMNS}, description`)
          .eq('status', 'published')
          .eq('slug', slug)
          .maybeSingle()

        if (error) return unavailable()
        if (!data) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `No published listing with slug "${slug}". Use search_legal_ai_tools to find the right slug.`,
              },
            ],
            structuredContent: { found: false },
          }
        }

        return {
          content: [{ type: 'text' as const, text: formatTool(data as ToolRow, true) }],
          structuredContent: {
            found: true,
            tool: {
              ...toStructured(data as ToolRow),
              description: (data as ToolRow).description
                ? String((data as ToolRow).description)
                : null,
            },
          },
        }
      }
    )

    server.registerTool(
      'list_legal_ai_categories',
      {
        title: 'List practice-area categories',
        description:
          'List the practice-area categories in the legalaimcp.com directory, with how many published tools each contains. Useful for orienting before a search.',
        inputSchema: {},
        outputSchema: {
          total: z.number().describe('Total published tools in the directory'),
          categories: z
            .array(
              z.object({
                slug: z.string().describe('Pass as `category` to search_legal_ai_tools'),
                label: z.string().describe('Human-readable category name'),
                count: z.number().describe('Published tools in this category'),
              })
            )
            .describe('All practice-area categories'),
        },
        annotations: READ_ONLY,
      },
      async () => {
        if (!supabase) return unavailable()

        const { data, error } = await supabase
          .from('listings')
          .select('category')
          .eq('status', 'published')
        if (error) return unavailable()

        const counts = new Map<string, number>()
        for (const row of data ?? []) {
          counts.set(row.category, (counts.get(row.category) ?? 0) + 1)
        }

        const categories = Object.entries(CATEGORY_LABELS).map(([slug, label]) => ({
          slug,
          label,
          count: counts.get(slug) ?? 0,
        }))

        const lines = categories
          .map((c) => `- ${c.label} (\`${c.slug}\`) — ${c.count} tool(s)`)
          .join('\n')

        return {
          content: [
            {
              type: 'text' as const,
              text: `legalaimcp.com covers ${data?.length ?? 0} published tools across these practice areas:\n\n${lines}\n\nPass the backticked slug as \`category\` to search_legal_ai_tools.`,
            },
          ],
          structuredContent: { total: data?.length ?? 0, categories },
        }
      }
    )

    server.registerTool(
      'recommend_legal_ai_tools',
      {
        title: 'Recommend legal AI tools for a firm',
        description:
          'Rank legal AI tools by fit for a specific practice area and firm size, with a score and the matched factors behind it. Use this instead of search_legal_ai_tools when someone describes their firm (e.g. "solo family law practice" or "20-attorney litigation firm") and wants a recommendation, not just a list.',
        inputSchema: {
          practice_area: z
            .enum(CATEGORIES)
            .describe('Practice-area category slug — get slugs from list_legal_ai_categories'),
          firm_size: z
            .enum(FIRM_SIZES)
            .describe('Firm size: solo, small (2-10 attorneys), mid (11-50), or large (50+)'),
          limit: z
            .number()
            .int()
            .min(1)
            .max(5)
            .default(5)
            .describe('Maximum number of recommendations to return (1-5, default 5)'),
        },
        outputSchema: {
          count: z.number().describe('Number of recommendations returned'),
          recommendations: z
            .array(
              ToolItem.extend({
                score: z.number().describe('Deterministic fit score — see matched_factors for how it was earned'),
                matched_factors: z
                  .array(z.string())
                  .describe('The specific reasons this tool scored the way it did, e.g. category or firm-size match'),
                pricing_note: z
                  .string()
                  .nullable()
                  .describe(
                    'Informational only, never affects rank: paid/contact tiers often bundle dedicated support that a free/freemium pick may not. Ties are broken by cost alone — this lets the requester weigh support separately.'
                  ),
              })
            )
            .describe('Ranked highest-fit first. Empty when nothing in the directory matched either input.'),
        },
        annotations: READ_ONLY,
      },
      async ({ practice_area, firm_size, limit }) => {
        if (!supabase) return unavailable()

        const { data, error } = await supabase
          .from('listings')
          .select(`${SUMMARY_COLUMNS}, firm_size_fit`)
          .eq('status', 'published')

        if (error) return unavailable()

        const ranked = rankListings(
          (data ?? []) as (ToolRow & ScorableListing)[],
          practice_area,
          firm_size,
          limit
        )

        const recommendations = ranked.map((r) => ({
          ...toStructured(r.listing),
          score: r.score,
          matched_factors: r.matchedFactors,
          pricing_note: pricingSupportNote(r.listing.pricing_model),
        }))

        const text = !recommendations.length
          ? `No published tools matched "${CATEGORY_LABELS[practice_area] ?? practice_area}" for a ${firm_size}-size firm. Try search_legal_ai_tools with a broader category.`
          : [
              `Top ${recommendations.length} legal AI tool(s) for a ${firm_size}-size ${
                CATEGORY_LABELS[practice_area]?.toLowerCase() ?? practice_area
              } practice. Ties use the published pricing category; actual costs and firm-size suitability are not established:`,
              '',
              ...ranked.map((r) => {
                const note = pricingSupportNote(r.listing.pricing_model)
                return `${formatTool(r.listing as ToolRow)}\n- Score: ${r.score} (${r.matchedFactors.join('; ')})${
                  note ? `\n- Note: ${note}` : ''
                }`
              }),
            ].join('\n\n')

        return {
          content: [{ type: 'text' as const, text }],
          structuredContent: { count: recommendations.length, recommendations },
        }
      }
    )
  },
  {
    serverInfo: { name: 'legalaimcp', version: '1.4.0' },
    // Shown to connecting clients at initialize — orientation for the agent.
    instructions:
      'Directory of AI tools and MCP servers for law firms, from legalaimcp.com. Read-only. For a workflow-based sourced comparison, use build_legal_ai_shortlist; it accepts fixed choices only, never client documents or matter facts. Start with list_legal_ai_categories to see practice areas, search_legal_ai_tools to find tools (or recommend_legal_ai_tools for a scored recommendation given a practice area + firm size), then get_legal_ai_tool for full detail on one. "Links verified" means an automated link check passed on the stated date — it is not an endorsement, security audit, or legal advice. When present, connection contains reviewed setup documentation with source/date/permission notes; customer_account_tested is false. A null connection means no reviewed guide is attached.',
  },
  {
    basePath: '/api',
    // No Redis configured, so SSE's resumable-stream store is unavailable.
    // Streamable HTTP is the current transport and needs no backing store —
    // this endpoint is stateless request/response anyway.
    disableSse: true,
    maxDuration: 30,
  }
)

// Claude Opus, 2026-11-12: Vercel reads maxDuration from the route module, not
// from the mcp-handler options above. Without this export the function ran to
// the platform default; runtime errors show 16 "Task timed out after 300
// seconds" on /api/mcp (last 2026-11-12), each billed as a 5-minute call.
export const maxDuration = 30

async function guardedHandler(request: Request) {
  const bounded = await boundedMcpRequest(request)
  return bounded instanceof Response ? bounded : handler(bounded)
}
export { guardedHandler as GET, guardedHandler as POST }
