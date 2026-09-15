// classification: PUBLIC
import { describe, expect, it } from 'vitest'
import { buildPilotBrief, pilotReviewSchema, pilotSchema, qualifyPilot } from './pilot-intake'

const valid = { requestId: '123e4567-e89b-42d3-a456-426614174000', name: 'Example Person', email: 'OWNER@example.org', organization: 'Example firm', workflow: 'Check that our software search returns matching tools.', endpoint: 'https://example.org/mcp', access: 'public', readOnly: 'yes', sampleInput: 'Find a contract tool', expectedResult: 'At least one matching software listing.', failureExample: 'An empty list despite a known matching listing.', pricingInterest: 'yes', consent: true, synthetic: true, source: 'pilot' }
describe('pilot scope and consent', () => {
  it('normalizes email and strips forged privileged fields', () => {
    const result = pilotSchema.parse({ ...valid, status: 'scoped', paid: true })
    expect(result.email).toBe('owner@example.org')
    expect(result).not.toHaveProperty('paid')
    expect(result).not.toHaveProperty('status')
    expect(qualifyPilot(result).fit).toBe('standard')
  })
  it('requires explicit contact permission and synthetic examples', () => {
    for (const field of ['consent', 'synthetic']) expect(pilotSchema.safeParse({ ...valid, [field]: false }).success).toBe(false)
  })
  it('routes access, write actions and unresolved pricing to scoping', () => {
    for (const patch of [{ access: 'authenticated' }, { readOnly: 'no' }, { endpoint: '' }, { pricingInterest: 'discuss' }]) {
      expect(qualifyPilot(pilotSchema.parse({ ...valid, ...patch })).fit).toBe('needs_scope')
    }
  })
  it('rejects endpoints containing credentials or unsupported addresses', () => {
    for (const endpoint of ['https://x:secret@example.org/mcp', 'https://example.org/mcp?key=secret', 'javascript:alert(1)', 'https://127.0.0.1/mcp', 'https://host.local/mcp']) {
      expect(pilotSchema.safeParse({ ...valid, endpoint }).success).toBe(false)
    }
  })
  it('does not call a draft a submitted or paid service', () => {
    const brief = buildPilotBrief(pilotSchema.parse(valid))
    expect(brief).toContain('not a submitted request')
    expect(brief).toContain('Endpoint (not contacted)')
    expect(brief).not.toContain(valid.email)
  })
  it('limits review states and support minutes', () => {
    expect(pilotReviewSchema.safeParse({ id: valid.requestId, status: 'paid', supportMinutes: 0 }).success).toBe(false)
    expect(pilotReviewSchema.safeParse({ id: valid.requestId, status: 'scoped', supportMinutes: -1 }).success).toBe(false)
  })
})
