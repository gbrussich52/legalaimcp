import { beforeEach, expect, it, vi } from 'vitest'
vi.mock('@/lib/supabase-admin', () => ({ getAdminClient: vi.fn() }))
vi.mock('@/lib/stripe', () => ({ getStripe: vi.fn(), isStripeConfigured: () => true }))
import { getAdminClient } from '@/lib/supabase-admin'
import { getStripe } from '@/lib/stripe'
import { makeFakeDb, type Op } from '@/lib/test-fake-db'
import { resetRateLimits } from '@/lib/rate-limit'
import { POST } from './route'

const INTENT = '22222222-2222-4222-8222-222222222222'
let ops: Op[]; let retrieve: ReturnType<typeof vi.fn>; let updated: boolean
const req = (b: unknown, ip = '1.1.1.1') => new Request('https://x.test/api/featured/cancel-reason', { method: 'POST', headers: { 'x-forwarded-for': ip }, body: JSON.stringify(b) })
beforeEach(() => {
  vi.resetAllMocks(); resetRateLimits(); updated = true
  vi.spyOn(console, 'error').mockImplementation(() => {})
  retrieve = vi.fn(async () => ({ status: 'open', url: 'https://checkout.stripe.com/c/pay/cs_1' }))
  vi.mocked(getStripe).mockReturnValue({ checkout: { sessions: { retrieve } } } as never)
  const f = makeFakeDb((op) => {
    if (op.table === 'featured_intents' && op.op === 'update') return { data: updated ? [{ id: INTENT, slug: 'gavel', stripe_session_id: 'cs_1' }] : [], error: null }
  })
  ops = f.ops; vi.mocked(getAdminClient).mockReturnValue(f.db)
})

it('rejects an unknown reason or a non-uuid intent', async () => {
  expect((await POST(req({ intent: INTENT, reason: 'because' }))).status).toBe(400)
  expect((await POST(req({ intent: 'abc', reason: 'price' }))).status).toBe(400)
  expect(ops).toHaveLength(0)
})
it('writes only the reason enum, never on a paid row, and logs the funnel step', async () => {
  const res = await POST(req({ intent: INTENT, reason: 'approval' }))
  expect(res.status).toBe(200)
  const upd = ops.filter((o) => o.table === 'featured_intents' && o.op === 'update')[0]
  expect(upd.payload).toEqual({ cancel_reason: 'approval' })
  expect(upd.filters).toContainEqual(['eq', 'id', INTENT]); expect(upd.filters).toContainEqual(['neq', 'status', 'paid'])
  const ev = ops.find((o) => o.table === 'funnel_events')!
  expect(ev.payload).toMatchObject({ step: 'featured_cancel_reason', slug: 'gavel', props: { reason: 'approval' } })
})
it('returns the open Stripe link to forward, else null', async () => {
  expect((await (await POST(req({ intent: INTENT, reason: 'price' }))).json()).payment_url).toContain('checkout.stripe.com')
  retrieve.mockResolvedValue({ status: 'expired', url: null })
  expect((await (await POST(req({ intent: INTENT, reason: 'price' }, '3.3.3.3'))).json()).payment_url).toBeNull()
})
it('a paid or unknown intent changes nothing and leaks nothing', async () => {
  updated = false
  const res = await POST(req({ intent: INTENT, reason: 'price' }))
  expect(res.status).toBe(200); expect((await res.json()).payment_url).toBeNull()
  expect(ops.some((o) => o.table === 'funnel_events')).toBe(false)
})
it('rate limits', async () => {
  const codes: number[] = []
  for (let i = 0; i < 12; i++) codes.push((await POST(req({ intent: INTENT, reason: 'price' }, '4.4.4.4'))).status)
  expect(codes[11]).toBe(429)
})
