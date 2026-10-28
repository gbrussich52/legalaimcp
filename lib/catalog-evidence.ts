import registry from './catalog-reviews.json'

type Evidence = { slug: string; reviewed_at: string; claims?: Record<string, unknown>; sources: Array<{ url: string; kind: string }> }
/** Do not attach a dated review to changed or incomplete public row data. */
export function getCatalogEvidence(row: Record<string, unknown>) {
  const review = (registry.reviews as Evidence[]).find(item => item.slug === row.slug)
  if (!review?.claims || !['name','tagline','category','external_url','pricing_model'].every(key => key in row)) return null
  for (const key of Object.keys(review.claims)) {
    if (key in row && JSON.stringify(row[key] ?? null) !== JSON.stringify(review.claims[key] ?? null)) return null
  }
  return { reviewed_at: review.reviewed_at, source_urls: review.sources.map(source => source.url), scope: 'public_documentation' as const, customer_account_tested: false as const }
}
