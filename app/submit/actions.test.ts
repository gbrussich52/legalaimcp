import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mutable holder so individual tests can swap the client (incl. null for the
// "Supabase not configured" degradation path).
const state: { client: unknown } = { client: null }
vi.mock('@/lib/supabase', () => ({
  get supabase() {
    return state.client
  },
}))

import { submitListing, type SubmissionState } from './actions'

const PREV: SubmissionState = { success: false, error: null }

const VALID_FIELDS: Record<string, string> = {
  name: 'Cool Legal Tool',
  tagline: 'An AI tool that does legal things fast.',
  category: 'legal_research',
  external_url: 'https://example.com',
  pricing_model: 'free',
  description:
    'A serious description of the tool that is definitely longer than fifty characters.',
  creator_name: 'Jane Smith',
  submitter_email: 'jane@example.com',
}

function makeFormData(overrides: Record<string, string> = {}, omit: string[] = []) {
  const fd = new FormData()
  for (const [k, v] of Object.entries({ ...VALID_FIELDS, ...overrides })) {
    if (!omit.includes(k)) fd.set(k, v)
  }
  return fd
}

function makeClient(insertError: { message: string } | null = null) {
  const inserted: Record<string, unknown>[] = []
  state.client = {
    from: vi.fn(() => ({
      insert: vi.fn(async (payload: Record<string, unknown>) => {
        inserted.push(payload)
        return { error: insertError }
      }),
    })),
  }
  return { inserted }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('submitListing — happy path', () => {
  it('stores a valid submission and splits PII out of listing_data', async () => {
    const { inserted } = makeClient()
    const res = await submitListing(PREV, makeFormData())
    expect(res).toEqual({ success: true, error: null })

    expect(inserted).toHaveLength(1)
    const row = inserted[0]
    expect(row.submitter_email).toBe('jane@example.com')
    expect(row.submitter_name).toBe('Jane Smith')
    const listingData = row.listing_data as Record<string, unknown>
    expect(listingData.name).toBe('Cool Legal Tool')
    // extracted before storage — must not be duplicated into listing_data
    expect(listingData).not.toHaveProperty('submitter_email')
    expect(listingData).not.toHaveProperty('creator_name')
  })
})

describe('submitListing — validation rejections', () => {
  it.each([
    ['missing name', {}, ['name']],
    ['name too short', { name: 'A' }, []],
    ['tagline too short', { tagline: 'short' }, []],
    ['invalid email', { submitter_email: 'not-an-email' }, []],
    ['invalid category enum', { category: 'totally_fake' }, []],
    ['injection-shaped category', { category: "general'; DROP TABLE submissions;--" }, []],
    ['invalid pricing enum', { pricing_model: 'stolen' }, []],
    ['javascript: external_url', { external_url: 'javascript:alert(1)' }, []],
    ['data: external_url', { external_url: 'data:text/html,<script>alert(1)</script>' }, []],
    ['javascript: creator_url', { creator_url: 'javascript:alert(1)' }, []],
    ['external_url not a URL', { external_url: 'not a url' }, []],
    ['description under 50 chars', { description: 'too short' }, []],
    ['description over 2000 chars', { description: 'x'.repeat(2001) }, []],
  ])('rejects %s without touching the DB', async (_label, overrides, omit) => {
    const { inserted } = makeClient()
    const res = await submitListing(PREV, makeFormData(overrides as Record<string, string>, omit as string[]))
    expect(res.success).toBe(false)
    expect(res.error).toBeTruthy()
    expect(inserted).toHaveLength(0)
  })

  it('strips forged privileged fields (status/featured/verified) via schema', async () => {
    const { inserted } = makeClient()
    const fd = makeFormData()
    fd.set('status', 'published')
    fd.set('featured', 'true')
    fd.set('verified', 'true')

    const res = await submitListing(PREV, fd)
    expect(res.success).toBe(true)
    const listingData = inserted[0].listing_data as Record<string, unknown>
    expect(listingData).not.toHaveProperty('status')
    expect(listingData).not.toHaveProperty('featured')
    expect(listingData).not.toHaveProperty('verified')
  })

  it('stores XSS payloads as inert data (no mutation, no rejection)', async () => {
    const { inserted } = makeClient()
    const payload = '<img src=x onerror=alert(1)> Legal Tool'
    const res = await submitListing(PREV, makeFormData({ name: payload }))
    expect(res.success).toBe(true)
    // Stored verbatim — output encoding is React's job at render time
    expect((inserted[0].listing_data as Record<string, unknown>).name).toBe(payload)
  })
})

describe('submitListing — infrastructure failures', () => {
  it('degrades gracefully when Supabase is not configured', async () => {
    state.client = null
    const res = await submitListing(PREV, makeFormData())
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/unavailable/i)
  })

  it('returns a generic error (no internals leaked) when the insert fails', async () => {
    makeClient({ message: 'duplicate key value violates unique constraint "pk"' })
    const res = await submitListing(PREV, makeFormData())
    expect(res.success).toBe(false)
    expect(res.error).not.toMatch(/duplicate|constraint|pk/i)
  })
})
