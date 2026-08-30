/**
 * Scoring for the recommend_legal_ai_tools MCP tool.
 *
 * Deterministic on purpose (decision: Fable review, 2026-08-29) — an LLM
 * re-ranking ~45 rows already narrowed by category can't be materially
 * better than a transparent score, and it would add cost/latency/a new
 * failure mode to an endpoint whose traffic is still unproven. Determinism
 * also matches the `idempotentHint: true` contract the other tools already
 * declare: same input, same ranking, every time.
 */

export type FirmSize = 'solo' | 'small' | 'mid' | 'large'
export const FIRM_SIZES: [FirmSize, ...FirmSize[]] = ['solo', 'small', 'mid', 'large']

/** The subset of a listings row the scorer needs. */
export interface ScorableListing {
  category: string
  firm_size_fit: string[] | null
  verified: boolean
  verified_at: string | null
  pricing_model: string
}

export interface ScoreResult {
  score: number
  matchedFactors: string[]
}

const WEIGHTS = { category: 3, firmSize: 2, verified: 1 } as const

/**
 * Scores one listing against a requested practice area + firm size.
 * `matchedFactors` is templated (not LLM prose) so the "why this fits" line
 * an agent relays is auditable against the actual data, not invented.
 */
export function scoreListing(
  listing: ScorableListing,
  practiceArea: string,
  firmSize: FirmSize
): ScoreResult {
  let score = 0
  const matchedFactors: string[] = []

  if (listing.category === practiceArea) {
    score += WEIGHTS.category
    matchedFactors.push(`matches your ${practiceArea.replace(/_/g, ' ')} practice area`)
  }
  if (listing.firm_size_fit?.includes(firmSize)) {
    score += WEIGHTS.firmSize
    matchedFactors.push(`tagged for ${firmSize}-size firms`)
  }
  if (listing.verified && listing.verified_at) {
    score += WEIGHTS.verified
    matchedFactors.push(`links verified ${listing.verified_at.slice(0, 10)}`)
  }

  return { score, matchedFactors }
}

/**
 * TODO(Giani): tie-break two listings that scored equally, using pricing fit
 * for the requested firm size. Domain call, not an engineering one — e.g.
 * should a solo practice see a free/freemium tool ranked ahead of an
 * equally-scored paid tool? Should a 20-attorney firm prefer "contact"
 * pricing (usually means dedicated/enterprise support) over freemium at a
 * tie? Return a negative number when `a` should rank before `b`, positive
 * when `b` should rank first, 0 for "no preference" (current default keeps
 * whatever order the DB query returned them in — verified-first).
 *
 * File: lib/recommend.ts. Covered by the tie-break tests in
 * lib/recommend.test.ts — flip the `.skip` on that describe block once this
 * has real logic.
 */
export function pricingFitTiebreak(
  a: ScorableListing,
  b: ScorableListing,
  firmSize: FirmSize
): number {
  return 0
}

export interface RankedListing<T extends ScorableListing> extends ScoreResult {
  listing: T
}

/**
 * Ranks listings for a practice area + firm size, highest score first, and
 * returns the top `limit`. Zero-score listings (nothing matched) are
 * dropped — a "recommendation" with no matched factors isn't one.
 */
export function rankListings<T extends ScorableListing>(
  listings: T[],
  practiceArea: string,
  firmSize: FirmSize,
  limit = 5
): RankedListing<T>[] {
  return listings
    .map((listing) => ({ listing, ...scoreListing(listing, practiceArea, firmSize) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || pricingFitTiebreak(a.listing, b.listing, firmSize))
    .slice(0, limit)
}
