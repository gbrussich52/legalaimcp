import { createHash } from 'node:crypto'
import records from './catalog-reviews.json'

// Trusted, source-controlled editorial records. Submission fields cannot grant approval.
// Link uptime, name similarity and AI-generated prose are never capability evidence.
const FIELDS = ['slug', 'name', 'tagline', 'description', 'category', 'external_url', 'mcp_repo_url', 'mcp_install_command', 'pricing_model', 'pricing_details', 'tags', 'creator_name', 'creator_url'] as const
type Candidate = { [K in typeof FIELDS[number]]?: unknown }
const digest = (text: string) => createHash('sha256').update(text).digest('hex')
export const catalogFingerprint = (listing: Candidate) => digest(JSON.stringify(FIELDS.map(key => [key, listing[key] ?? null])))
const normalize = (text: string) => text.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
export const sourceFingerprint = (text: string) => digest(normalize(text))

export type CatalogReview = {
  slug: string; decision: string; reviewed_at: string; reviewer: string; listing_sha256: string
  identity_confirmed: boolean; capabilities_confirmed: boolean; mcp_confirmed: boolean
  sources: Array<{ url: string; kind: string; sha256: string; quote: string }>
}

export function isCatalogQuarantined(listing: Candidate) {
  if (records.blocked_slugs.includes(String(listing.slug))) return true
  return ['external_url', 'mcp_repo_url', 'creator_url'].some(key => {
    try {
      const host = new URL(String(listing[key as keyof Candidate])).hostname.toLowerCase()
      return records.blocked_domains.some(domain => host === domain || host.endsWith(`.${domain}`))
    } catch { return false }
  })
}

/** Normal admission fails closed. This is editorial evidence, not a customer integration test. */
export async function assertCatalogReview(listing: Candidate, {
  reviews = records.reviews as CatalogReview[], fetcher = fetch, now = new Date(),
}: { reviews?: CatalogReview[]; fetcher?: typeof fetch; now?: Date } = {}): Promise<void> {
  if (isCatalogQuarantined(listing)) throw new Error('Publication blocked: reported product misattribution requires a new editorial decision.')
  const review = reviews.find(item => item.slug === listing.slug && item.decision === 'approved')
  if (!review || !review.reviewer?.trim()) throw new Error('Publication blocked: a primary-source review is required. See docs/catalog-review.md.')
  if (review.listing_sha256 !== catalogFingerprint(listing)) throw new Error('Publication blocked: listing claims or destination changed since review.')
  const reviewedAt = Date.parse(`${review.reviewed_at}T00:00:00Z`)
  const age = now.getTime() - reviewedAt
  if (!/^\d{4}-\d{2}-\d{2}$/.test(review.reviewed_at) || !Number.isFinite(age) || new Date(reviewedAt).toISOString().slice(0, 10) !== review.reviewed_at || age < 0 || age > 90 * 86400000) throw new Error('Publication blocked: source review date is invalid or older than 90 days.')
  const claimsMcp = Boolean(listing.mcp_repo_url || listing.mcp_install_command) || /\bmcp\b|model context protocol/i.test(JSON.stringify(listing))
  if (review.identity_confirmed !== true || review.capabilities_confirmed !== true || (claimsMcp && review.mcp_confirmed !== true)) {
    throw new Error('Publication blocked: product identity, every advertised capability and any MCP claim must be explicitly confirmed.')
  }
  if (!review.sources?.length || review.sources.length > 5) throw new Error('Publication blocked: primary-source evidence is required (maximum five sources).')
  for (const source of review.sources) {
    if (!['vendor', 'maintainer'].includes(source.kind)) throw new Error('Publication blocked: evidence must be a primary vendor or maintainer source.')
    const url = new URL(source.url)
    // Only trusted checked-in review URLs are fetched, never URLs supplied by a submission.
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !/^[a-z][a-z0-9.-]*\.[a-z]{2,}$/i.test(url.hostname) || /(^|\.)(localhost|local|internal|test|invalid)$/.test(url.hostname)) throw new Error('Publication blocked: invalid primary source URL.')
    if (!/^[a-f0-9]{64}$/.test(source.sha256) || normalize(source.quote).length < 15) throw new Error('Publication blocked: a source fingerprint and supporting quote are required.')
    const response = await fetcher(url, { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(12000) })
    if (!response.ok) throw new Error('Publication blocked: primary source unavailable.')
    // Bound response consumption, including chunked bodies without Content-Length.
    const reader = response.body?.getReader()
    if (!reader) throw new Error('Publication blocked: primary source unavailable.')
    const chunks: Uint8Array[] = []; let size = 0
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > 2_000_000) throw new Error('Publication blocked: primary source exceeds review size limit.')
        chunks.push(value)
      }
    } finally { await reader.cancel() }
    const text = Buffer.concat(chunks).toString('utf8')
    if (sourceFingerprint(text) !== source.sha256) throw new Error('Publication blocked: primary source changed; review it again.')
    if (!normalize(text).includes(normalize(source.quote))) throw new Error('Publication blocked: supporting quote is absent from the primary source.')
  }
}
