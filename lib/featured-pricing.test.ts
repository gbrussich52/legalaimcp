import { describe, expect, it } from 'vitest'
import { featuredState } from './featured-pricing'

// Claude Sonnet 5.5, 2026-11-22: a payment must never replace an editorial pick that has no end date.
const now = new Date('2026-11-22T12:00:00Z')

describe('featuredState', () => {
  it('editorial pick: featured with no end date', () => {
    expect(featuredState(true, null, now)).toBe('editorial')
  })
  it('paid and still running', () => {
    expect(featuredState(true, '2026-12-01T00:00:00Z', now)).toBe('paid-active')
  })
  it('paid but past its end date can buy again', () => {
    expect(featuredState(true, '2026-11-01T00:00:00Z', now)).toBe('none')
  })
  it('not featured can buy', () => {
    expect(featuredState(false, null, now)).toBe('none')
    expect(featuredState(false, '2026-11-01T00:00:00Z', now)).toBe('none')
  })
})
