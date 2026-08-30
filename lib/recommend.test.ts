import { describe, it, expect } from 'vitest'
import { scoreListing, rankListings, type ScorableListing } from './recommend'

function listing(overrides: Partial<ScorableListing> = {}): ScorableListing {
  return {
    category: 'document_processing',
    firm_size_fit: [],
    verified: false,
    verified_at: null,
    pricing_model: 'free',
    ...overrides,
  }
}

describe('scoreListing', () => {
  it('scores zero and reports no matched factors when nothing matches', () => {
    const r = scoreListing(listing({ category: 'billing_time' }), 'legal_research', 'large')
    expect(r.score).toBe(0)
    expect(r.matchedFactors).toEqual([])
  })

  it('awards category match (weight 3)', () => {
    const r = scoreListing(listing({ category: 'legal_research' }), 'legal_research', 'large')
    expect(r.score).toBe(3)
    expect(r.matchedFactors[0]).toMatch(/legal research/)
  })

  it('awards firm-size match (weight 2) independent of category', () => {
    const r = scoreListing(
      listing({ category: 'billing_time', firm_size_fit: ['solo', 'small'] }),
      'legal_research',
      'solo'
    )
    expect(r.score).toBe(2)
    expect(r.matchedFactors[0]).toMatch(/solo-size/)
  })

  it('awards verified match (weight 1) only when both verified AND verified_at are set', () => {
    const verifiedNoDate = scoreListing(
      listing({ category: 'billing_time', verified: true, verified_at: null }),
      'document_processing',
      'solo'
    )
    expect(verifiedNoDate.score).toBe(0)

    const verifiedWithDate = scoreListing(
      listing({ category: 'document_processing', verified: true, verified_at: '2026-08-12T00:00:00Z' }),
      'document_processing',
      'solo'
    )
    expect(verifiedWithDate.score).toBe(4) // category (3) + verified (1)
    expect(verifiedWithDate.matchedFactors.some((f) => f.includes('2026-08-12'))).toBe(true)
  })

  it('stacks all three factors to the max score of 6', () => {
    const r = scoreListing(
      listing({
        category: 'compliance',
        firm_size_fit: ['mid', 'large'],
        verified: true,
        verified_at: '2026-08-01',
      }),
      'compliance',
      'large'
    )
    expect(r.score).toBe(6)
    expect(r.matchedFactors).toHaveLength(3)
  })
})

describe('rankListings', () => {
  it('drops zero-score listings entirely', () => {
    const listings = [listing({ category: 'billing_time' }), listing({ category: 'legal_research' })]
    const ranked = rankListings(listings, 'legal_research', 'solo')
    expect(ranked).toHaveLength(1)
    expect(ranked[0].listing.category).toBe('legal_research')
  })

  it('sorts highest score first', () => {
    const low = listing({ category: 'legal_research' }) // score 3
    const high = listing({ category: 'legal_research', firm_size_fit: ['solo'] }) // score 5
    const ranked = rankListings([low, high], 'legal_research', 'solo')
    expect(ranked.map((r) => r.score)).toEqual([5, 3])
  })

  it('respects the limit', () => {
    const listings = Array.from({ length: 10 }, () => listing({ category: 'legal_research' }))
    expect(rankListings(listings, 'legal_research', 'solo', 3)).toHaveLength(3)
  })

  it('preserves input order among equal scores (stable sort, no tiebreak logic yet)', () => {
    const a = listing({ category: 'legal_research', pricing_model: 'free' })
    const b = listing({ category: 'legal_research', pricing_model: 'contact' })
    const ranked = rankListings([a, b], 'legal_research', 'solo')
    expect(ranked.map((r) => r.listing.pricing_model)).toEqual(['free', 'contact'])
  })

  it('returns an empty array when no listing matches anything', () => {
    const listings = [listing({ category: 'billing_time' }), listing({ category: 'compliance' })]
    expect(rankListings(listings, 'legal_research', 'solo')).toEqual([])
  })
})

// TODO(Giani): once pricingFitTiebreak has real logic, un-skip and fill in
// the expected ordering for these two cases (see the TODO in recommend.ts).
describe.skip('pricingFitTiebreak', () => {
  it.todo('ranks a free/freemium tool above an equally-scored paid tool for a solo firm')
  it.todo('ranks a contact-pricing tool above an equally-scored freemium tool for a large firm')
})
