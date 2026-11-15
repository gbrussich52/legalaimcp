import { beforeEach, expect, it, vi } from 'vitest'
vi.mock('@/lib/supabase-admin', () => ({ getAdminClient: vi.fn() }))
vi.mock('@/lib/stripe', () => ({
  FEATURED_PRICE_CENTS: 6900, getStripe: vi.fn(), isStripeConfigured: () => true, getStripePriceFeatured30d: () => 'price_x',
}))
import { getAdminClient } from '@/lib/supabase-admin'
import { getStripe } from '@/lib/stripe'
import { makeFakeDb, type Op } from '@/lib/test-fake-db'
import { resetRateLimits } from '@/lib/rate-limit'
import { POST } from './route'

const LID = '11111111-1111-4111-8111-111111111111'
const INTENT = '22222222-2222-4222-8222-222222222222'
let create: ReturnType<typeof vi.fn>
let failIntentInsert: boolean
let failFunnel: boolean
let ops: Op[]

function body(over: Record<string, unknown> = {}) {
  return { listing_id: LID, slug: 'gavel', email: 'Jane@Firm.com', role: 'works_here', ...over }
}
function req(b: unknown, ip = '9.9.9.9') {
  return new Request('https://x.test/api/stripe/checkout', { method: 'POST', headers: { 'x-forwarded-for': ip }, body: JSON.stringify(b) })
}
beforeEach(() => {
  vi.resetAllMocks(); resetRateLimits(); failIntentInsert = false; failFunnel = false
  vi.spyOn(console, 'error').mockImplementation(() => {})
  // Claude Fable 5.2 (executor), 2026-11-15: ordering proof, the intent row must exist before Stripe is called.
  create = vi.fn(async () => { expect(ops.some((o) => o.table === 'featured_intents' && o.op === 'insert')).toBe(true); return { id: 'cs_1', url: 'https://checkout.stripe.com/c/pay/cs_1' } })
  vi.mocked(getStripe).mockReturnValue({ checkout: { sessions: { create } } } as never)
  const fake = makeFakeDb((op) => {
    if (op.table === 'listings') return { data: { id: LID, slug: 'gavel', name: 'Gavel', status: 'published' }, error: null }
    if (op.table === 'featured_intents' && op.op === 'insert') return failIntentInsert ? { data: null, error: { message: 'x' } } : { data: { id: INTENT }, error: null }
    if (op.table === 'funnel_events' && failFunnel) return { data: null, error: { message: 'down' } }
  })
  ops = fake.ops
  vi.mocked(getAdminClient).mockReturnValue(fake.db)
})

it('rejects a missing or malformed email and a bad role before touching Stripe', async () => {
  for (const b of [body({ email: undefined }), body({ email: 'nope' }), body({ role: 'boss' }), body({ email: 'x@mailinator.com' })]) {
    expect((await POST(req(b))).status).toBe(400)
  }
  expect(create).not.toHaveBeenCalled()
})
it('honeypot: a filled hidden field is refused with no writes', async () => {
  expect((await POST(req(body({ website: 'http://spam' })))).status).toBe(400)
  expect(ops.length).toBe(0); expect(create).not.toHaveBeenCalled()
})
it('stores the intent first, then creates the session with prefill, reference id and recovery', async () => {
  const res = await POST(req(body()))
  expect(res.status).toBe(200)
  const intentInsert = ops.find((o) => o.table === 'featured_intents' && o.op === 'insert')!
  expect(intentInsert.payload).toMatchObject({ listing_id: LID, slug: 'gavel', email: 'jane@firm.com', role: 'works_here', status: 'started' })
  const args = create.mock.calls[0][0]
  expect(args.customer_email).toBe('jane@firm.com')
  expect(args.client_reference_id).toBe(INTENT)
  expect(args.after_expiration).toEqual({ recovery: { enabled: true } })
  expect(args.metadata).toMatchObject({ listing_id: LID, slug: 'gavel', product: 'featured_30d', amount_cents: '6900', intent_id: INTENT })
  expect(args.success_url).toMatch(/^https:\/\/(www\.)?legalaimcp\.com\/featured\/success\?session_id=\{CHECKOUT_SESSION_ID\}&slug=gavel$/)
  expect(args.cancel_url).toContain(`/featured/cancel?slug=gavel&intent=${INTENT}`)
  const upd = ops.find((o) => o.table === 'featured_intents' && o.op === 'update')!
  expect(upd.payload).toEqual({ stripe_session_id: 'cs_1' })
  const steps = ops.filter((o) => o.table === 'funnel_events').map((o) => o.payload?.step)
  expect(steps).toEqual(['featured_intent_submitted', 'featured_stripe_redirect'])
  expect(JSON.stringify(ops.filter((o) => o.table === 'funnel_events'))).not.toContain('@')
})
it('"just looking" is allowed to continue', async () => {
  expect((await POST(req(body({ role: 'just_looking' })))).status).toBe(200)
})
it('a failing funnel insert does not break checkout', async () => {
  failFunnel = true
  const res = await POST(req(body()))
  expect(res.status).toBe(200); expect((await res.json()).url).toContain('checkout.stripe.com')
})
it('a failing intent insert is logged and the buyer still reaches Stripe', async () => {
  failIntentInsert = true
  expect((await POST(req(body()))).status).toBe(200)
  expect(create.mock.calls[0][0].client_reference_id).toBeUndefined()
})
it('rate limits per client', async () => {
  const codes: number[] = []
  for (let i = 0; i < 7; i++) codes.push((await POST(req(body(), '5.5.5.5'))).status)
  expect(codes.slice(0, 5).every((c) => c === 200)).toBe(true)
  expect(codes.slice(5)).toEqual([429, 429])
})
