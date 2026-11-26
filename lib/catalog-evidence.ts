import registry from './catalog-reviews.json'

type Evidence = { slug: string; reviewed_at: string; claims?: Record<string, unknown>; sources: Array<{ url: string; kind: string }> }
// Claude Sonnet 5.5, 2026-11-23: the review lookup is split out so the "Check this yourself" block can read the stored
// quotes and the operator under the same rule as the dated source label. Before, only getCatalogEvidence existed.
/** The stored review for a slug, only when the public row still matches what was reviewed. Never attach a dated review to changed or incomplete public row data. */
export function getMatchingReview<T extends { slug: string; claims?: Record<string, unknown> }>(row: Record<string, unknown>, reviews: readonly T[] = registry.reviews as unknown as T[]): T | null {
  const review = reviews.find(item => item.slug === row.slug)
  if (!review?.claims || !['name','tagline','category','external_url','pricing_model'].every(key => key in row)) return null
  for (const key of Object.keys(review.claims)) {
    if (key in row && JSON.stringify(row[key] ?? null) !== JSON.stringify(review.claims[key] ?? null)) return null
  }
  return review
}
/** Do not attach a dated review to changed or incomplete public row data. */
export function getCatalogEvidence(row: Record<string, unknown>) {
  const review = getMatchingReview<Evidence>(row)
  if (!review) return null
  return { reviewed_at: review.reviewed_at, source_urls: review.sources.map(source => source.url), scope: 'public_documentation' as const, customer_account_tested: false as const }
}
