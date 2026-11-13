// Claude Sonnet 5.5, 2026-11-12: an Offer must carry price and priceCurrency, or not exist.
import { describe, expect, it } from 'vitest'
import { softwareAppSchema } from './software-schema'

const base = { name: 'X', tagline: 'T', slug: 'x' }

describe('softwareAppSchema', () => {
  it('emits a priced Offer for a free listing', () => {
    const s = softwareAppSchema({ ...base, pricing_model: 'free' }) as any
    expect(s.offers).toEqual({ '@type': 'Offer', price: '0', priceCurrency: 'USD' })
  })
  it.each(['paid', 'freemium', 'contact'])('emits no Offer for %s', (m) => {
    const s = softwareAppSchema({ ...base, pricing_model: m as any }) as any
    expect(s.offers).toBeUndefined()
  })
})
