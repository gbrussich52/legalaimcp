import { beforeEach, expect, it, vi } from 'vitest'
vi.mock('@/lib/supabase-admin', () => ({ getAdminClient: vi.fn() }))
import { getAdminClient } from '@/lib/supabase-admin'
import { makeFakeDb } from '@/lib/test-fake-db'
import { recordFunnelEvent } from '@/lib/funnel'

beforeEach(() => { vi.resetAllMocks(); vi.spyOn(console, 'error').mockImplementation(() => {}) })

it('writes step, slug and allow-listed props only', async () => {
  const { db, ops } = makeFakeDb(() => undefined)
  vi.mocked(getAdminClient).mockReturnValue(db)
  await recordFunnelEvent('featured_cancel_reason', 'gavel', { reason: 'price', role: 'agency' })
  expect(ops[0].table).toBe('funnel_events')
  expect(ops[0].payload).toEqual({ step: 'featured_cancel_reason', slug: 'gavel', props: { reason: 'price', role: 'agency' } })
})
it('drops a prop key outside the allow-list', async () => {
  const { db, ops } = makeFakeDb(() => undefined)
  vi.mocked(getAdminClient).mockReturnValue(db)
  await recordFunnelEvent('featured_click', 'gavel', { reason: 'price', note: 'free text', ip: '1.2.3.4' } as never)
  expect(ops[0].payload?.props).toEqual({ reason: 'price' })
})
it('rejects an email-shaped value and any value outside the enum', async () => {
  const { db, ops } = makeFakeDb(() => undefined)
  vi.mocked(getAdminClient).mockReturnValue(db)
  await recordFunnelEvent('featured_intent_submitted', 'gavel', { role: 'me@firm.com', reason: 'anything goes' } as never)
  expect(ops[0].payload?.props).toEqual({})
})
it('drops a malformed slug instead of storing free text', async () => {
  const { db, ops } = makeFakeDb(() => undefined)
  vi.mocked(getAdminClient).mockReturnValue(db)
  await recordFunnelEvent('featured_click', 'me@firm.com', {})
  expect(ops[0].payload?.slug).toBeNull()
})
it('never throws when the insert errors, rejects or the client is missing', async () => {
  vi.mocked(getAdminClient).mockReturnValue(makeFakeDb(() => ({ data: null, error: { message: 'down' } })).db)
  await expect(recordFunnelEvent('featured_click', 'gavel')).resolves.toBeUndefined()
  vi.mocked(getAdminClient).mockImplementation(() => { throw new Error('no env') })
  await expect(recordFunnelEvent('featured_click', 'gavel')).resolves.toBeUndefined()
})
