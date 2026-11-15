import { beforeEach, expect, it, vi } from 'vitest'
vi.mock('@/lib/supabase-admin', () => ({ getAdminClient: vi.fn() }))
import { getAdminClient } from '@/lib/supabase-admin'
import { makeFakeDb } from '@/lib/test-fake-db'
import { resetRateLimits } from '@/lib/rate-limit'
import { POST } from './route'

const req = (b: unknown, ip = '1.1.1.1') => new Request('https://x.test/api/featured/click', { method: 'POST', headers: { 'x-forwarded-for': ip }, body: JSON.stringify(b) })
beforeEach(() => { vi.resetAllMocks(); resetRateLimits(); vi.spyOn(console, 'error').mockImplementation(() => {}) })

it('writes exactly one featured_click for a slug', async () => {
  const f = makeFakeDb(() => undefined); vi.mocked(getAdminClient).mockReturnValue(f.db)
  expect((await POST(req({ slug: 'gavel' }))).status).toBe(204)
  expect(f.ops).toHaveLength(1)
  expect(f.ops[0].payload).toMatchObject({ step: 'featured_click', slug: 'gavel' })
})
it('accepts only {slug}: extra keys and bad slugs are refused', async () => {
  const f = makeFakeDb(() => undefined); vi.mocked(getAdminClient).mockReturnValue(f.db)
  expect((await POST(req({ slug: 'gavel', email: 'a@b.com' }))).status).toBe(400)
  expect((await POST(req({ slug: 'a@b.com' }))).status).toBe(400)
  expect(f.ops).toHaveLength(0)
})
it('rate limits and survives a failing insert', async () => {
  vi.mocked(getAdminClient).mockReturnValue(makeFakeDb(() => ({ data: null, error: { message: 'down' } })).db)
  const codes: number[] = []
  for (let i = 0; i < 32; i++) codes.push((await POST(req({ slug: 'gavel' }, '2.2.2.2'))).status)
  expect(codes[0]).toBe(204); expect(codes[31]).toBe(429)
})
