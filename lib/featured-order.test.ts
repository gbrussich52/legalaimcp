import { describe, expect, it } from 'vitest'
import { compareFeatured, FEATURED_ORDER, orderFeaturedFirst } from './featured-order'

// Claude Sonnet 5.5, 2026-11-22: paid placement must sort ahead of editorial picks and the rest.
const paid = { name: 'Zed', featured: true, featured_until: '2026-12-10T00:00:00Z' }
const editorial = { name: 'Alpha', featured: true, featured_until: null }
const plain = { name: 'Beta', featured: false, featured_until: null }
// What the expiry cron leaves behind: featured off, end date cleared.
const expiredCleared = { name: 'Aardvark', featured: false, featured_until: null }

describe('compareFeatured', () => {
  it('paid-active, then editorial, then plain', () => {
    expect([plain, editorial, paid].sort(compareFeatured)).toEqual([paid, editorial, plain])
  })
  it('an expired paid row is not above a never-featured row', () => {
    const rows = [plain, expiredCleared].sort(compareFeatured)
    expect(rows.map((r) => r.name)).toEqual(['Aardvark', 'Beta']) // by name only
    expect([editorial, expiredCleared].sort(compareFeatured)[0]).toBe(editorial)
  })
  it('name breaks ties inside each group', () => {
    const p2 = { ...paid, name: 'Alpha paid' }
    expect([paid, p2].sort(compareFeatured).map((r) => r.name)).toEqual(['Alpha paid', 'Zed'])
    expect([{ ...editorial, name: 'B' }, { ...editorial, name: 'A' }].sort(compareFeatured).map((r) => r.name)).toEqual(['A', 'B'])
  })
  it('the soonest-ending paid row does not outrank a later one by name', () => {
    const later = { ...paid, name: 'Later', featured_until: '2026-12-20T00:00:00Z' }
    expect([paid, later].sort(compareFeatured)[0]).toBe(later)
  })
})

describe('orderFeaturedFirst', () => {
  it('chains the order spec onto the query, nulls last for featured_until', () => {
    const calls: unknown[][] = []
    const q = { order(c: string, o: object) { calls.push([c, o]); return q } }
    expect(orderFeaturedFirst(q)).toBe(q)
    expect(calls).toEqual([
      ['featured', { ascending: false }],
      ['featured_until', { ascending: false, nullsFirst: false }],
    ])
    expect(FEATURED_ORDER).toHaveLength(2)
  })
})

// Claude Sonnet 5.5, 2026-11-22: homepage grid must show active paid placements first, then price tier.
import { sortHomeFeatured } from './featured-order'
describe('sortHomeFeatured', () => {
  const now = new Date('2026-11-22T12:00:00Z')
  const r = (name: string, pricing_model: string, featured_until: string | null = null) => ({ name, pricing_model, featured: true, featured_until })
  const names = (rows: { name: string }[]) => rows.map((x) => x.name)
  it('paid-active is first whatever its price tier', () => {
    const rows = [r('contact', 'contact'), r('paidFree', 'free', '2026-12-10T00:00:00Z'), r('paid', 'paid')]
    expect(names(sortHomeFeatured(rows, now))[0]).toBe('paidFree')
  })
  it('two paid rows keep their incoming order', () => {
    const rows = [r('p1', 'free', '2026-12-10T00:00:00Z'), r('p2', 'contact', '2026-12-11T00:00:00Z')]
    expect(names(sortHomeFeatured(rows, now))).toEqual(['p1', 'p2'])
  })
  it('editorial rows keep the price-tier order', () => {
    const rows = [r('free', 'free'), r('contact', 'contact'), r('freemium', 'freemium'), r('paid', 'paid')]
    expect(names(sortHomeFeatured(rows, now))).toEqual(['contact', 'paid', 'freemium', 'free'])
  })
  it('an expired paid row is treated as editorial', () => {
    const rows = [r('contact', 'contact'), r('old', 'free', '2026-11-01T00:00:00Z')]
    expect(names(sortHomeFeatured(rows, now))).toEqual(['contact', 'old'])
  })
})
