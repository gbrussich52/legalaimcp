// classification: PUBLIC
import { z } from 'zod'
import { CATEGORY_LABELS, PRICING_LABELS, SITE_URL } from './constants'
import { getSoftwareConnection } from './connections'
import { getCatalogEvidence } from './catalog-evidence'
import { buildVerification, buildVerificationSummary, VerificationSchema, VerificationSummarySchema, CHECK_LABELS } from './verification'

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
  source_review: z.object({
    reviewed_at: z.string(),
    source_urls: z.array(z.string().url()),
    scope: z.literal('public_documentation'),
    customer_account_tested: z.literal(false),
  }).nullable().describe('Dated primary-source review for the matching published claims. This is not a runtime, security or legal-output test.'),
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
// Claude Sonnet 5.5, 2026-11-23: list answers carry only a compact summary; get_legal_ai_tool carries the full checks.
// Before, an agent got no sign that LegalAIMCP is not the vendor, nor what was checked or how to repeat it.
export const ListItem = ToolItem.extend({ verification_summary: VerificationSummarySchema.describe('Independence, check date and counts by result. Call get_legal_ai_tool for the checks and how to repeat each one.') })
export const DetailItem = ToolItem.extend({
  description: z.string().nullable().describe('Full listing description'),
  verification: VerificationSchema.describe('LegalAIMCP is not the vendor. What we checked, when, and how to repeat each check without us.'),
})

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
    source_review: getCatalogEvidence(t),
  }
}

/** List shape: the listing plus the compact verification summary. */
export function toListItem(t: ToolRow): z.infer<typeof ListItem> {
  return { ...toStructured(t), verification_summary: buildVerificationSummary(t) }
}
/** Detail shape: the listing plus the full verification record. */
export function toDetailItem(t: ToolRow): z.infer<typeof DetailItem> {
  return { ...toStructured(t), description: t.description ? String(t.description) : null, verification: buildVerification(t) }
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
  const evidence = getCatalogEvidence(t)
  if (evidence) lines.push(`- Public documentation reviewed: ${evidence.reviewed_at}; customer-account operation not tested`, ...evidence.source_urls.map(url => `- Primary source: ${url}`))
  if (connection) {
    lines.push(`- Connection: ${connection.kind === 'official' ? 'vendor/publisher documented' : 'community implementation'}; documentation reviewed ${connection.reviewed}; customer account not tested`, `- Setup source: ${connection.source}`)
    if (verbose) lines.push(`- Requirements: ${connection.requirements}`, `- Permissions: ${connection.permissions}`, `- Setup: ${connection.setup}`)
  } else {
    lines.push('- Connection: no reviewed setup guide attached; compatibility not established')
  }
  if (verbose) {
    // Claude Sonnet 5.5, 2026-11-23: the prose twin of `verification`, for clients that show text only.
    const v = buildVerification(t)
    lines.push('', `Independence: ${v.statement}`)
    if (v.checked_at) lines.push(`Checks run ${v.checked_at}:`, ...v.checks.map(c => `- ${CHECK_LABELS[c.id] ?? c.id} (${c.result === 'unknown' ? 'could not check' : c.result}): ${c.observed} Repeat: ${c.how_to_repeat}`))
    else lines.push('Checks: not run yet for this listing.')
    lines.push(`Not checked: ${v.not_checked.join('; ')}.`, `How we check listings: ${v.method_url}`)
  }
  if (verbose && t.description) lines.push('', String(t.description))
  return lines.filter(Boolean).join('\n')
}

