import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { CATEGORY_LABELS, PRICING_LABELS, SITE_URL } from '@/lib/constants'

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
const TOOL_SHAPE = {
  slug: z.string().describe('Stable listing identifier — pass to get_legal_ai_tool'),
  name: z.string().describe('Tool name'),
  tagline: z.string().nullable().describe('One-line summary'),
  category: z.string().describe('Practice-area category slug'),
  category_label: z.string().describe('Human-readable category name'),
  pricing_model: z.string().describe('One of: free, freemium, paid, contact'),
  pricing_details: z.string().nullable().describe('Pricing notes, if any'),
  links_verified: z
    .boolean()
    .describe(
      'True if an automated check confirmed every URL on this listing resolved, as of links_verified_at. An automated link check only — NOT an endorsement, security audit, or legal review.'
    ),
  links_verified_at: z
    .string()
    .nullable()
    .describe('ISO date of the last passing link check; null = not confirmed (often just bot-blocking)'),
  website: z.string().nullable().describe('Tool website'),
  repo: z.string().nullable().describe('Source repository, if open source'),
  install_command: z.string().nullable().describe('MCP install command, if the tool ships an MCP server'),
  maker: z.string().nullable().describe('Creator or vendor name'),
  listing_url: z.string().describe('Canonical listing page on legalaimcp.com'),
}
const ToolItem = z.object(TOOL_SHAPE)
type ToolRow = Record<string, unknown>

/** Maps a DB row to the structured shape. One mapper feeds both tools. */
function toStructured(t: ToolRow): z.infer<typeof ToolItem> {
  return {
    slug: String(t.slug),
    name: String(t.name),
    tagline: (t.tagline as string) ?? null,
    category: String(t.category),
    category_label: CATEGORY_LABELS[t.category as string] ?? String(t.category),
    pricing_model: String(t.pricing_model),
    pricing_details: (t.pricing_details as string) ?? null,
    links_verified: Boolean(t.verified && t.verified_at),
    links_verified_at: t.verified && t.verified_at ? String(t.verified_at).slice(0, 10) : null,
    website: (t.external_url as string) ?? null,
    repo: (t.mcp_repo_url as string) ?? null,
    install_command: (t.mcp_install_command as string) || null,
    maker: (t.creator_name as string) ?? null,
    listing_url: `${SITE_URL}/servers/${t.slug}`,
  }
}

/** Renders one listing as compact text. Prose twin of toStructured(). */
function formatTool(t: ToolRow, verbose = false): string {
  const lines = [
    `## ${t.name}`,
    t.tagline ? `${t.tagline}` : '',
    `- Category: ${CATEGORY_LABELS[t.category as string] ?? t.category}`,
    `- Pricing: ${PRICING_LABELS[t.pricing_model as string] ?? t.pricing_model}${
      t.pricing_details ? ` — ${t.pricing_details}` : ''
    }`,
    t.creator_name ? `- Maker: ${t.creator_name}` : '',
    // The date is not decoration. See the note at the top of this file.
    t.verified && t.verified_at
      ? `- Links verified: ${String(t.verified_at).slice(0, 10)} (automated link check only — not an endorsement, security audit, or legal review)`
      : `- Links verified: not confirmed (usually means the site blocks automated checks, not that the tool is bad)`,
    t.external_url ? `- Website: ${t.external_url}` : '',
    t.mcp_repo_url ? `- Repo: ${t.mcp_repo_url}` : '',
    t.mcp_install_command ? `- Install: \`${t.mcp_install_command}\`` : '',
    `- Listing: ${SITE_URL}/servers/${t.slug}`,
  ]
  if (verbose && t.description) lines.push('', String(t.description))
  return lines.filter(Boolean).join('\n')
}

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

        let q = supabase
          .from('listings')
          .select(SUMMARY_COLUMNS)
          .eq('status', 'published')
          // Verified first, then featured: surface what we can actually stand
          // behind ahead of what we merely chose to highlight.
          .order('verified', { ascending: false })
          .order('featured', { ascending: false })
          .limit(limit)

        if (category) q = q.eq('category', category)
        if (pricing) q = q.eq('pricing_model', pricing)
        if (query) {
          // Tokenise, then match ANY token across name/tagline/description.
          //
          // Two failures this fixes, both discovered by calling the deployed
          // endpoint rather than by reading the code:
          //
          // 1. Phrase-matching a natural-language query. `ilike '%contract
          //    review%'` demands that exact adjacent phrase, but assistants
          //    send prose, not keywords. "contract review" matched 2 of 45
          //    listings; "contract" alone matches far more.
          // 2. Searching name/tagline only. The website has a human scanning
          //    a results page as a safety net; an assistant takes the first
          //    response as the answer and moves on. Recall matters more than
          //    precision when the consumer cannot scroll.
          //
          // Stopwords are dropped because a token like "for" or "tool" would
          // otherwise ilike-match nearly every description and flatten the
          // ranking into noise. Capped at 4 tokens to bound the URL length
          // PostgREST has to parse. Metacharacters are stripped first — an
          // MCP tool argument is attacker-controlled the same way a query
          // param is.
          const STOPWORDS = new Set([
            'the', 'a', 'an', 'for', 'and', 'or', 'of', 'to', 'in', 'on',
            'with', 'my', 'me', 'i', 'ai', 'tool', 'tools', 'legal', 'law',
            'best', 'good', 'need', 'want', 'that', 'this', 'is', 'are',
          ])
          const tokens = query
            .replace(/[,()*\\%]/g, ' ')
            .toLowerCase()
            .split(/\s+/)
            .filter((t) => t.length > 2 && !STOPWORDS.has(t))
            .slice(0, 4)

          // If the query was entirely stopwords, fall back to the raw string
          // rather than silently dropping the filter and returning everything
          // as though it all matched.
          const terms = tokens.length ? tokens : [query.replace(/[,()*\\%]/g, ' ').trim()]
          const clauses = terms
            .filter(Boolean)
            .flatMap((t) => [
              `name.ilike.%${t}%`,
              `tagline.ilike.%${t}%`,
              `description.ilike.%${t}%`,
            ])
          if (clauses.length) q = q.or(clauses.join(','))
        }

        const { data, error } = await q
        if (error) return unavailable()

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
  },
  {
    serverInfo: { name: 'legalaimcp', version: '1.1.0' },
    // Shown to connecting clients at initialize — orientation for the agent.
    instructions:
      'Directory of AI tools and MCP servers for law firms, from legalaimcp.com. Read-only. Start with list_legal_ai_categories to see practice areas, search_legal_ai_tools to find tools, then get_legal_ai_tool for full detail on one. "Links verified" means an automated link check passed on the stated date — it is not an endorsement, security audit, or legal advice.',
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

export { handler as GET, handler as POST }
