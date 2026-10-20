// classification: PUBLIC
import { z } from 'zod'
import { CATEGORY_LABELS, PRICING_LABELS, SITE_URL } from './constants'
import { getSoftwareConnection } from './connections'

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
  connection: z.object({
    type: z.enum(['official', 'community']),
    source_url: z.string().url(),
    documentation_reviewed_at: z.string(),
    requirements: z.string(),
    permissions: z.string(),
    setup: z.string(),
    customer_account_tested: z.literal(false),
  }).nullable().describe('Reviewed setup documentation, not a compatibility or security test. Null means no reviewed setup guide is attached, not that a connector cannot exist.'),
}
export const ToolItem = z.object(TOOL_SHAPE)
export type ToolRow = Record<string, unknown>

/** Maps a DB row to the structured shape. Shared by search, detail and recommendation tools. */
export function toStructured(t: ToolRow): z.infer<typeof ToolItem> {
  const connection = getSoftwareConnection(String(t.slug))
  return {
    connection: connection ? {
      type: connection.kind,
      source_url: connection.source,
      documentation_reviewed_at: connection.reviewed,
      requirements: connection.requirements,
      permissions: connection.permissions,
      setup: connection.setup,
      customer_account_tested: false,
    } : null,
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
export function formatTool(t: ToolRow, verbose = false): string {
  const lines = [
    `## ${t.name}`,
    t.tagline ? `${t.tagline}` : '',
    `- Category: ${CATEGORY_LABELS[t.category as string] ?? t.category}`,
    `- Pricing: ${PRICING_LABELS[t.pricing_model as string] ?? t.pricing_model}${
      t.pricing_details ? ` — ${t.pricing_details}` : ''
    }`,
    t.creator_name ? `- Maker: ${t.creator_name}` : '',
    // Link resolution is a dated claim, separate from reviewed setup evidence.
    t.verified && t.verified_at
      ? `- Links verified: ${String(t.verified_at).slice(0, 10)} (automated link check only — not an endorsement, security audit, or legal review)`
      : `- Links verified: not confirmed (usually means the site blocks automated checks, not that the tool is bad)`,
    t.external_url ? `- Website: ${t.external_url}` : '',
    t.mcp_repo_url ? `- Repo: ${t.mcp_repo_url}` : '',
    t.mcp_install_command ? `- Install: \`${t.mcp_install_command}\`` : '',
    `- Listing: ${SITE_URL}/servers/${t.slug}`,
  ]
  const connection = getSoftwareConnection(String(t.slug))
  if (connection) {
    lines.push(`- Connection: ${connection.kind === 'official' ? 'vendor/publisher documented' : 'community implementation'}; documentation reviewed ${connection.reviewed}; customer account not tested`, `- Setup source: ${connection.source}`)
    if (verbose) lines.push(`- Requirements: ${connection.requirements}`, `- Permissions: ${connection.permissions}`, `- Setup: ${connection.setup}`)
  } else {
    lines.push('- Connection: no reviewed setup guide attached; compatibility not established')
  }
  if (verbose && t.description) lines.push('', String(t.description))
  return lines.filter(Boolean).join('\n')
}

