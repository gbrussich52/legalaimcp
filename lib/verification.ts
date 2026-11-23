// Claude Sonnet 5.5, 2026-11-23: the public "Check this yourself" evidence, built once and used by the listing page
// and by the MCP server. Why: a reader or an AI agent that pulls a listing must see that LegalAIMCP is not the vendor,
// what was checked and when, and how to repeat each check without us. Everything here comes from two files,
// lib/catalog-realness.json (checks) and lib/catalog-reviews.json (quotes, operator). Nothing is read from the
// vendor's own row except to confirm the review still matches it. Stored text is untrusted data: callers render it
// as text, and links are https only.
import { z } from 'zod'
import realnessFile from './catalog-realness.json'
import reviewsFile from './catalog-reviews.json'
import { getMatchingReview } from './catalog-evidence'
import { SITE_URL } from './constants'
import type { Check, CheckResult, RealnessRecord } from './realness'

export const METHOD_PATH = '/how-we-verify'
export const FULL_RECORD_TOOL = 'get_legal_ai_tool'

export const CHECK_LABELS: Record<string, string> = {
  site: 'Website',
  domain_age: 'Domain registration',
  mail: 'Mail records',
  security_resolver: 'Security DNS resolver',
  mcp_endpoint: 'MCP server',
  repo: 'Code repository',
  registry: 'Official MCP registry',
}
export const RESULT_LABELS: Record<CheckResult, string> = {
  pass: 'Passed',
  warn: 'Warning',
  fail: 'Failed',
  unknown: 'Could not check',
  not_applicable: 'Does not apply',
}
/** The same list the listing block prints under "What we did not check". */
export const NOT_CHECKED = [
  'Opening a customer account',
  'Using the product on a real matter',
  'Testing its security',
  'Checking any legal output for accuracy',
] as const
export const VERIFICATION_STATEMENT = 'LegalAIMCP is an independent directory, not the vendor. These are the checks we ran and how to repeat them. Repeat them before you rely on this listing.'

// ---------------------------------------------------------- text fragments ----

const MAX_FRAGMENT_QUOTE = 200
/**
 * Link to a quote on its source page, using a text fragment (#:~:text=) so a browser scrolls to it and marks it.
 * In that syntax a comma splits start from end, a dash marks a prefix or suffix and an ampersand starts the next
 * directive, so all three are percent-encoded along with everything else that is not a plain letter or digit.
 * Falls back to the plain URL when the quote is empty, runs past 200 characters, has a line break (code blocks),
 * or when the URL is not https or already holds a fragment (a second one would be ignored or break the first).
 */
export function textFragmentUrl(url: string, quote: string): string {
  const text = String(quote ?? '').replace(/[\s ]+/g, (m) => (/[\r\n]/.test(m) ? '\n' : ' ')).trim()
  if (!text || text.length > MAX_FRAGMENT_QUOTE || text.includes('\n')) return url
  if (!url.startsWith('https://') || url.includes('#')) return url
  // encodeURIComponent already encodes comma and ampersand; the dash and the marks it leaves bare are encoded too.
  const encoded = encodeURIComponent(text).replace(/[-!'()*]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`)
  return `${url}#:~:text=${encoded}`
}

/** Only https links are ever rendered as links. */
export function httpsHref(url: unknown): string | null {
  if (typeof url !== 'string' || url.length > 2000) return null
  try { return new URL(url).protocol === 'https:' ? url : null } catch { return null }
}
export function hostnameOf(url: string): string {
  try { return new URL(url).hostname } catch { return url }
}

// Claude Sonnet 5.5, 2026-11-23: the listing page printed "MCP Repository" for every mcp_repo_url, including live
// endpoints such as https://mcp.captain.legal/connect/. Same rule as scripts/realness.mjs: a URL on a shared code host
// is a repository; any other https URL there is the declared endpoint. A test keeps the two host lists equal.
export const CODE_HOSTS = new Set(['github.com', 'gitlab.com', 'bitbucket.org', 'codeberg.org', 'huggingface.co', 'npmjs.com', 'pypi.org', 'github.io', 'gitlab.io'])
export function mcpUrlLabel(url: string): 'MCP endpoint' | 'MCP Repository' {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    if (u.protocol !== 'https:' || [...CODE_HOSTS].some((d) => host === d || host.endsWith(`.${d}`))) return 'MCP Repository'
    return 'MCP endpoint'
  } catch { return 'MCP Repository' }
}

// ---------------------------------------------------------------- checks ----

/** The checks a reader may see: public, and not "does not apply". An unknown result stays in, shown as "Could not check". */
export type PublicCheck = Check & { result: Exclude<CheckResult, 'not_applicable'> }
export function publicChecks(record: RealnessRecord | null | undefined): PublicCheck[] {
  return (record?.checks ?? []).filter((check): check is PublicCheck => check.public === true && check.result !== 'not_applicable')
}

const Operator = z.union([
  z.object({ name: z.string().min(1), register: z.string().min(1), url: z.string().refine((u) => httpsHref(u) !== null), status: z.string().min(1), checked_at: z.string().min(1) }).strict(),
  z.object({ status: z.literal('not_found'), note: z.string().min(1) }).strict(),
])
export type Operator = z.infer<typeof Operator>

type ReviewShape = { slug: string; reviewed_at: string; claims?: Record<string, unknown>; sources: Array<{ url: string; kind: string; quote: string }>; operator?: unknown }
export type VerificationSource = {
  record: RealnessRecord | null
  review: { reviewed_at: string; sources: Array<{ url: string; kind: string; quote: string }> } | null
  operator: Operator | null
}

/** Realness record by slug; the review and its operator only when the public row still matches what was reviewed. */
export function getVerificationSource(row: Record<string, unknown>, data: { reviews?: readonly ReviewShape[]; records?: Record<string, RealnessRecord> } = {}): VerificationSource {
  const record = (data.records ?? (realnessFile.records as unknown as Record<string, RealnessRecord>))[String(row.slug)] ?? null
  const review = getMatchingReview<ReviewShape>(row, data.reviews ?? (reviewsFile.reviews as unknown as ReviewShape[]))
  const operator = review?.operator === undefined ? null : (Operator.safeParse(review.operator).data ?? null)
  return { record, review: review ? { reviewed_at: review.reviewed_at, sources: review.sources } : null, operator }
}

// ------------------------------------------------------------ MCP answers ----

const methodUrl = `${SITE_URL}${METHOD_PATH}`

export function buildVerification(row: Record<string, unknown>) {
  const { record, operator } = getVerificationSource(row)
  return {
    independent: true as const,
    statement: VERIFICATION_STATEMENT,
    checked_at: record?.checked_at ?? null,
    checks: publicChecks(record).map(({ id, result, observed, how_to_repeat }) => ({ id, result, observed, how_to_repeat })),
    operator,
    not_checked: [...NOT_CHECKED],
    method_url: methodUrl,
    listing_url: `${SITE_URL}/servers/${String(row.slug)}`,
  }
}

export function buildVerificationSummary(row: Record<string, unknown>) {
  const record = getVerificationSource(row).record
  const counts = { pass: 0, warn: 0, fail: 0, unknown: 0 }
  for (const check of publicChecks(record)) if (check.result in counts) counts[check.result as keyof typeof counts] += 1
  return {
    independent: true as const,
    checked_at: record?.checked_at ?? null,
    checks_by_result: counts,
    method_url: methodUrl,
    full_record_tool: FULL_RECORD_TOOL,
  }
}

const CheckOut = z.object({ id: z.string(), result: z.enum(['pass', 'warn', 'fail', 'unknown']), observed: z.string(), how_to_repeat: z.string() })
export const VerificationSchema = z.object({
  independent: z.literal(true).describe('Always true: LegalAIMCP is an independent directory, not the vendor of any listed tool.'),
  statement: z.string(),
  checked_at: z.string().nullable().describe('Date the checks were run; null when this listing has not been checked yet.'),
  checks: z.array(CheckOut).describe('What we observed, each with a command you can run to see it too. unknown means the check could not be run, not that it failed.'),
  operator: Operator.nullable().describe('The operator as found in a public company register, or a not_found note. Null means no register lookup is on record.'),
  not_checked: z.array(z.string()).describe('What we did not do. A passing check is not a recommendation.'),
  method_url: z.string(),
  listing_url: z.string(),
})
export const VerificationSummarySchema = z.object({
  independent: z.literal(true),
  checked_at: z.string().nullable(),
  checks_by_result: z.object({ pass: z.number(), warn: z.number(), fail: z.number(), unknown: z.number() }),
  method_url: z.string(),
  full_record_tool: z.string().describe('Call this tool with the slug to get the checks and how to repeat them.'),
})
