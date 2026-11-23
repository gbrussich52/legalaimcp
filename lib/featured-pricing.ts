/**
 * Featured placement pricing (client-safe — no Stripe SDK).
 * Peer-undercut: market peers often charge ~$99 / 30 days.
 */
export const FEATURED_PRICE_CENTS = 6900
export const FEATURED_DURATION_DAYS = 30

// Claude Sonnet 5.5, 2026-11-22: one place that says what a listing's placement is, so the buy
// button and the checkout route agree. Editorial = featured with no end date; paying on one
// would stamp an end date and the expiry cron would then remove a placement that had none.
export type FeaturedState = 'editorial' | 'paid-active' | 'none'

export function featuredState(
  featured: boolean | null | undefined,
  featuredUntil: string | null | undefined,
  now: Date,
): FeaturedState {
  if (!featured) return 'none'
  if (featuredUntil == null) return 'editorial'
  return new Date(featuredUntil).getTime() > now.getTime() ? 'paid-active' : 'none'
}
