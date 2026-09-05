/** Counts published rows using the URL slugs consumed by category cards. */
export function countListingsByCategory(rows: { category: string }[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const { category } of rows) {
    const slug = category.replace(/_/g, '-')
    counts[slug] = (counts[slug] ?? 0) + 1
  }
  return counts
}
