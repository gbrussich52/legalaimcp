// Claude Fable 5.2, 2026-11-23: the post-build check looked for the word "null" on pages whose record has no pricing
// claim. These tests pin what the check must look for, and prove it against every real record.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expectedEvidence } from '../scripts/catalog-artifact-evidence.mjs'

const policy = JSON.parse(readFileSync(resolve(__dirname, 'catalog-reviews.json'), 'utf8'))
const review = (over: Record<string, unknown> = {}) => ({
  slug: 'acme-draft',
  reviewed_at: '2026-11-22',
  claims: { name: 'Acme Draft', pricing_details: 'From $20 a month', ...over },
  sources: [{ url: 'https://acme.example/pricing' }, { url: 'https://acme.example/docs' }],
})

describe('expectedEvidence (post-build page check)', () => {
  it('asks for name, the sources heading, the review date, every source URL and the pricing text', () => {
    expect(expectedEvidence(review())).toEqual([
      'Acme Draft', 'Primary sources reviewed', '2026-11-22', 'https://acme.example/pricing', 'https://acme.example/docs', 'From $20 a month',
    ])
  })

  it('asks for no pricing text when the record makes no pricing claim', () => {
    const list = expectedEvidence(review({ pricing_details: null }))
    expect(list).toHaveLength(5)
    expect(list.every((v: unknown) => typeof v === 'string' && v.length > 0)).toBe(true)
    expect(list).not.toContain('null')
  })

  it('refuses a record with no name, and an empty pricing string', () => {
    expect(() => expectedEvidence(review({ name: '' }))).toThrow('missing required evidence')
    expect(() => expectedEvidence(review({ pricing_details: '' }))).toThrow('unusable pricing claim')
  })

  it('returns only real strings for every record in the checked-in catalog, including those with no pricing', () => {
    const noPricing = policy.reviews.filter((r: { claims: { pricing_details: unknown } }) => r.claims.pricing_details == null)
    expect(noPricing.length).toBeGreaterThan(0)
    for (const r of policy.reviews) {
      const list = expectedEvidence(r)
      expect(list.every((v: unknown) => typeof v === 'string' && v.length > 0)).toBe(true)
      expect(list).toHaveLength(3 + r.sources.length + (r.claims.pricing_details == null ? 0 : 1))
    }
  })
})
