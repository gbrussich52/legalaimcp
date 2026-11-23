// PUBLIC. The exact strings a source-reviewed listing page must show.
// Claude Fable 5.2, 2026-11-23: split out of check-catalog-artifacts.mjs so it can be tested. The post-build check
// searched every page for review.claims.pricing_details. For a record with no pricing claim that value is null, and
// String.includes(null) looks for the word "null", so the production build would fail on a page that is correct.
// All 42 earlier records carried pricing text, so the gap never showed; 7 of the 27 records admitted on
// 2026-11-22 have none. A page with no pricing claim prints no pricing section, so there is nothing to look for.
// Claude Sonnet 5.5, 2026-11-23: the listing block is now titled "Check this yourself" (it replaces "Primary sources
// reviewed"); the build check must look for the new heading or every reviewed page would fail it.
export function expectedEvidence(review) {
  const required = [review.claims.name, 'Check this yourself', review.reviewed_at, ...review.sources.map((s) => s.url)]
  for (const value of required) {
    if (typeof value !== 'string' || value.length === 0) throw Error(`Review record is missing required evidence text: ${review.slug}`)
  }
  const pricing = review.claims.pricing_details
  if (pricing == null) return required
  if (typeof pricing !== 'string' || pricing.length === 0) throw Error(`Review record has an unusable pricing claim: ${review.slug}`)
  return [...required, pricing]
}
