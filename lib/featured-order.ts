// Claude Sonnet 5.5, 2026-11-22: pricing promises paid placements sort first. One order spec
// shared by every listing query: featured desc (paid and editorial above the rest), then
// featured_until desc with nulls last (paid, which has an end date, above editorial, which has
// none). Expired paid rows get featured=false and featured_until=null from the expiry cron, so
// they sort with the plain rows by name.
export const FEATURED_ORDER = [
  { column: 'featured', ascending: false, nullsFirst: undefined },
  { column: 'featured_until', ascending: false, nullsFirst: false },
] as const

type Orderable<Q> = {
  order(column: string, options: { ascending: boolean; nullsFirst?: boolean }): Q
}

/** Chain the featured order onto a Supabase query builder. */
export function orderFeaturedFirst<Q extends Orderable<Q>>(query: Q): Q {
  let q = query
  for (const o of FEATURED_ORDER) {
    q = q.order(
      o.column,
      o.nullsFirst === undefined ? { ascending: o.ascending } : { ascending: o.ascending, nullsFirst: o.nullsFirst },
    )
  }
  return q
}

type Row = { name: string; featured: boolean; featured_until: string | null }

/** In-memory twin of FEATURED_ORDER plus a name tie-break; used to test the rule. */
export function compareFeatured(a: Row, b: Row): number {
  if (a.featured !== b.featured) return a.featured ? -1 : 1
  if (a.featured_until !== b.featured_until) {
    if (a.featured_until == null) return 1
    if (b.featured_until == null) return -1
    return a.featured_until < b.featured_until ? 1 : -1
  }
  return a.name.localeCompare(b.name)
}

// Claude Sonnet 5.5, 2026-11-22: the homepage re-sorts its six by price tier (CRO rule #10), which
// buried paid rows. Active paid placements now come first; the price-tier order is unchanged for the
// rest. Array.sort is stable, so equal rows keep their incoming order.
const PRICING_ANCHOR_ORDER: Record<string, number> = { contact: 0, paid: 1, freemium: 2, free: 3 }

export function sortHomeFeatured<T extends { pricing_model: string; featured: boolean; featured_until: string | null }>(
  rows: T[],
  now: Date,
): T[] {
  const paidActive = (r: T) => r.featured && r.featured_until != null && new Date(r.featured_until).getTime() > now.getTime()
  return rows.slice().sort(
    (a, b) =>
      Number(paidActive(b)) - Number(paidActive(a)) ||
      (PRICING_ANCHOR_ORDER[a.pricing_model] ?? 99) - (PRICING_ANCHOR_ORDER[b.pricing_model] ?? 99),
  )
}

// Claude Sonnet 5.5, 2026-11-23: category pages only. The pricing page promises paid placements a sort
// boost there, but verified came first, and every newly admitted listing is unverified, so a paying vendor
// ranked below every verified plain row. A non-null end date means a paid term, so it sorts first (nulls
// last), then verified, then featured, then name. Best-of pages keep verified first on purpose.
export const CATEGORY_ORDER = [
  { column: 'featured_until', ascending: false, nullsFirst: false },
  { column: 'verified', ascending: false, nullsFirst: undefined },
  { column: 'featured', ascending: false, nullsFirst: undefined },
  { column: 'name', ascending: true, nullsFirst: undefined },
] as const

/** Chain the category-page order onto a Supabase query builder. */
export function orderCategoryPage<Q extends Orderable<Q>>(query: Q): Q {
  let q = query
  for (const o of CATEGORY_ORDER) {
    q = q.order(
      o.column,
      o.nullsFirst === undefined ? { ascending: o.ascending } : { ascending: o.ascending, nullsFirst: o.nullsFirst },
    )
  }
  return q
}

type CategoryRow = Row & { verified: boolean }

/** In-memory twin of CATEGORY_ORDER; used to test the rule. */
export function compareCategory(a: CategoryRow, b: CategoryRow): number {
  const aPaid = a.featured_until != null
  const bPaid = b.featured_until != null
  if (aPaid !== bPaid) return aPaid ? -1 : 1
  if (aPaid && a.featured_until !== b.featured_until) return (a.featured_until as string) < (b.featured_until as string) ? 1 : -1
  if (a.verified !== b.verified) return a.verified ? -1 : 1
  if (a.featured !== b.featured) return a.featured ? -1 : 1
  return a.name.localeCompare(b.name)
}
