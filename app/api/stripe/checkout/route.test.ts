import { beforeEach, expect, it, vi } from 'vitest'
// Claude Sonnet 5.5, 2026-11-22: checkout must refuse editorial picks so a vendor never pays to lose an open-ended placement.
vi.mock('@/lib/supabase-admin', () => ({ getAdminClient: vi.fn() }))
vi.mock('@/lib/stripe', () => ({
  FEATURED_PRICE_CENTS: 6900,
  getStripe: vi.fn(),
  getStripePriceFeatured30d: () => 'price_test',
  isStripeConfigured: () => true,
}))
import { getAdminClient } from '@/lib/supabase-admin'
import { getStripe } from '@/lib/stripe'
import { POST } from './route'

let row: Record<string, unknown>
let selected: string
const create = vi.fn()

function req() {
  return new Request('https://example.com/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify({ slug: 'acme' }),
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  create.mockResolvedValue({ url: 'https://checkout.stripe.test/s', id: 'cs_1' })
  selected = ''
  const builder = {
    select: vi.fn((cols: string) => { selected = cols; return builder }),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => ({ data: row, error: null })),
  }
  vi.mocked(getAdminClient).mockReturnValue({ from: () => builder } as unknown as ReturnType<typeof getAdminClient>)
  vi.mocked(getStripe).mockReturnValue({ checkout: { sessions: { create } } } as unknown as ReturnType<typeof getStripe>)
})

it('refuses an editorial pick with 409 and creates no session', async () => {
  row = { id: 'l1', slug: 'acme', name: 'Acme', status: 'published', featured: true, featured_until: null }
  const res = await POST(req())
  expect(res.status).toBe(409)
  expect(await res.json()).toEqual({ error: 'This listing is already featured by our editors. There is nothing to buy.' })
  expect(create).not.toHaveBeenCalled()
  expect(selected).toContain('featured_until')
})

it('still sells to a listing that is not featured', async () => {
  row = { id: 'l1', slug: 'acme', name: 'Acme', status: 'published', featured: false, featured_until: null }
  const res = await POST(req())
  expect(res.status).toBe(200)
  expect(create).toHaveBeenCalledTimes(1)
})

// Claude Sonnet 5.5, 2026-11-23: a second purchase inside an active paid term restarts the 30 days and loses the unused ones.
it('still sells a renewal once the paid term has ended', async () => {
  row = { id: 'l1', slug: 'acme', name: 'Acme', status: 'published', featured: true, featured_until: '2020-01-01T00:00:00Z' }
  expect((await POST(req())).status).toBe(200)
})

it('refuses a second purchase during an active paid term with 409', async () => {
  row = { id: 'l1', slug: 'acme', name: 'Acme', status: 'published', featured: true, featured_until: '2099-01-01T00:00:00Z' }
  const res = await POST(req())
  expect(res.status).toBe(409)
  expect(await res.json()).toEqual({ error: 'This listing already has a paid placement. You can renew after it ends.' })
  expect(create).not.toHaveBeenCalled()
})
