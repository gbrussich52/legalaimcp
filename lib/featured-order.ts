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
