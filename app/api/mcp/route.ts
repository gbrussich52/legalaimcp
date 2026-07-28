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
 */

// Shape returned to clients. Kept narrow on purpose: `description` runs to
// 2000 chars and would blow up an assistant's context for a list of 20 tools
// with no benefit — detail lives behind `get_tool`.
const SUMMARY_COLUMNS =
  'slug, name, tagline, category, pricing_model, pricing_details, verified, verified_at, external_url, mcp_repo_url, mcp_install_command, creator_name'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as [string, ...string[]]
const PRICING = Object.keys(PRICING_LABELS) as [string, ...string[]]

/** Renders one listing as compact text. MCP clients read this, not JSON. */
function formatTool(t: Record<string, unknown>, verbose = false): string {
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

/** Consistent failure text. An MCP client shows this to a human, so it says what to do next. */
function unavailable() {
  return {
    content: [
      {
        type: 'text' as const,
        text: `The legalaimcp directory is temporarily unreachable. Browse ${SITE_URL}/servers directly.`,
      },
    ],
  }
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      'search_legal_ai_tools',
      'Search the legalaimcp.com directory of AI tools and MCP servers built for law firms. Filter by free-text query, practice-area category, and pricing model. Use this when someone asks what AI tooling exists for legal work such as contract review, legal research, client intake, billing, or compliance.',
      {
        query: z
          .string()
          .max(100)
          .optional()
          .describe('Free-text search over tool names and taglines, e.g. "contract review"'),
        category: z
          .enum(CATEGORIES)
          .optional()
          .describe('Practice area filter'),
        pricing: z
          .enum(PRICING)
          .optional()
          .describe('Pricing model filter'),
        limit: z.number().int().min(1).max(25).default(10),
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
          // Strip PostgREST filter metacharacters before interpolating into
          // an `or` string. This is the same class of injection the site's
          // search guard handles; an MCP tool argument is attacker-controlled
          // in exactly the same way a query param is.
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
          // PostgREST has to parse.
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
        if (!data?.length) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `No tools matched. The directory covers ${
                  Object.keys(CATEGORY_LABELS).length
                } practice areas — try a broader query or browse ${SITE_URL}/servers.`,
              },
            ],
          }
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: [
                `Found ${data.length} tool(s) in the legalaimcp.com directory:`,
                '',
                ...data.map((t) => formatTool(t as Record<string, unknown>)),
              ].join('\n\n'),
            },
          ],
        }
      }
    )

    server.tool(
      'get_legal_ai_tool',
      'Get the full listing for one legal AI tool by its slug, including the complete description and MCP install command. Use after search_legal_ai_tools to go deeper on a specific result.',
      {
        slug: z
          .string()
          .max(100)
          .regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, numbers and hyphens')
          .describe('Listing slug, e.g. "harvey-ai" — taken from a search result URL'),
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
          }
        }

        return {
          content: [
            { type: 'text' as const, text: formatTool(data as Record<string, unknown>, true) },
          ],
        }
      }
    )

    server.tool(
      'list_legal_ai_categories',
      'List the practice-area categories in the legalaimcp.com directory, with how many published tools each contains. Useful for orienting before a search.',
      {},
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

        const lines = Object.entries(CATEGORY_LABELS)
          .map(([slug, label]) => `- ${label} (\`${slug}\`) — ${counts.get(slug) ?? 0} tool(s)`)
          .join('\n')

        return {
          content: [
            {
              type: 'text' as const,
              text: `legalaimcp.com covers ${data?.length ?? 0} published tools across these practice areas:\n\n${lines}\n\nPass the backticked slug as \`category\` to search_legal_ai_tools.`,
            },
          ],
        }
      }
    )
  },
  {
    serverInfo: { name: 'legalaimcp', version: '1.0.0' },
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
