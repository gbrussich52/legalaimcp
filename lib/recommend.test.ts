import { describe, it, expect } from 'vitest'
import { scoreListing, rankListings, pricingFitTiebreak, pricingSupportNote, type ScorableListing } from './recommend'

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

  it('breaks ties on cost, cheapest first, regardless of firm size', () => {
    const cheap = listing({ category: 'legal_research', pricing_model: 'free' })
    const pricey = listing({ category: 'legal_research', pricing_model: 'contact' })
    // Reversed input order proves this is the tiebreak acting, not incidental DB order.
    const ranked = rankListings([pricey, cheap], 'legal_research', 'large')
    expect(ranked.map((r) => r.listing.pricing_model)).toEqual(['free', 'contact'])
  })

  it('returns an empty array when no listing matches anything', () => {
    const listings = [listing({ category: 'billing_time' }), listing({ category: 'compliance' })]
    expect(rankListings(listings, 'legal_research', 'solo')).toEqual([])
  })
})

describe('pricingFitTiebreak', () => {
  it('ranks free before freemium before paid before contact', () => {
    expect(pricingFitTiebreak(listing({ pricing_model: 'free' }), listing({ pricing_model: 'paid' }))).toBeLessThan(0)
    expect(
      pricingFitTiebreak(listing({ pricing_model: 'freemium' }), listing({ pricing_model: 'contact' }))
    ).toBeLessThan(0)
  })

  it('is a no-op between two listings on the same pricing tier', () => {
    expect(pricingFitTiebreak(listing({ pricing_model: 'paid' }), listing({ pricing_model: 'paid' }))).toBe(0)
  })
})

describe('pricingSupportNote', () => {
  it('flags paid and contact tiers as often bundling dedicated support', () => {
    expect(pricingSupportNote('paid')).toMatch(/dedicated support/)
    expect(pricingSupportNote('contact')).toMatch(/dedicated support/)
  })

  it('returns null for free and freemium — nothing to weigh against cost', () => {
    expect(pricingSupportNote('free')).toBeNull()
    expect(pricingSupportNote('freemium')).toBeNull()
  })
})
