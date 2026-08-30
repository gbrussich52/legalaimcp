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

/** Cheapest to most expensive. Ties within a tier (e.g. two "paid" tools) stay 0. */
const PRICING_ORDER: Record<string, number> = { free: 0, freemium: 1, paid: 2, contact: 3 }

/**
 * Tie-break two equally-scored listings by cost: cheaper wins, regardless of
 * firm size. Giani's call (2026-08-29): "if it does the same thing and it's
 * free, that's what I'm picking" — he doesn't know his buyers well enough to
 * assume a large firm wants to pay more, so the ranking doesn't guess either.
 * Willingness to pay for dedicated support is surfaced instead via
 * `pricingSupportNote()`, not baked into the ranking.
 */
export function pricingFitTiebreak(a: ScorableListing, b: ScorableListing): number {
  return (PRICING_ORDER[a.pricing_model] ?? 99) - (PRICING_ORDER[b.pricing_model] ?? 99)
}

/**
 * Informational only — never affects score or rank. A paid/contact tier
 * commonly bundles dedicated support that a free/freemium pick may not, and
 * some firms value that enough to pay for it even though cost alone ranks
 * it lower. Surfaced so the requester (or the agent relaying this) can weigh
 * it, rather than the ranking silently deciding it for them.
 */
export function pricingSupportNote(pricingModel: string): string | null {
  return pricingModel === 'paid' || pricingModel === 'contact'
    ? 'Paid tier — often includes dedicated support that a free/freemium option may not.'
    : null
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
    .sort((a, b) => b.score - a.score || pricingFitTiebreak(a.listing, b.listing))
    .slice(0, limit)
}
