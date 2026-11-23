import { beforeEach, expect, it, vi } from 'vitest'
// Claude Sonnet 5.5, 2026-11-22: the cron must clear featured_until with featured, so an expired paid row sorts like a plain one.
vi.mock('@/lib/supabase-admin', () => ({ getAdminClient: vi.fn() }))
import { getAdminClient } from '@/lib/supabase-admin'
import { GET } from './route'

const calls: Array<[string, ...unknown[]]> = []
beforeEach(() => {
  vi.resetAllMocks()
  calls.length = 0
  vi.stubEnv('CRON_SECRET', 'secret')
  const b: Record<string, unknown> = {}
  for (const m of ['update', 'eq', 'not', 'lt']) {
    b[m] = vi.fn((...a: unknown[]) => { calls.push([m, ...a]); return b })
  }
  b.select = vi.fn(async () => ({ data: [{ id: '1', slug: 'x' }], error: null }))
  vi.mocked(getAdminClient).mockReturnValue({ from: () => b } as unknown as ReturnType<typeof getAdminClient>)
})

it('clears featured and featured_until on expired paid rows only', async () => {
  const res = await GET(new Request('https://x.test/api/cron/expire-featured', { headers: { authorization: 'Bearer secret' } }))
  expect(res.status).toBe(200)
  expect(calls.find((c) => c[0] === 'update')?.[1]).toEqual({ featured: false, featured_until: null })
  // Claude Sonnet 5.5, 2026-11-23: no featured filter, so a row with a past end date and featured=false is cleaned too.
  expect(calls.some((c) => c[0] === 'eq' && c[1] === 'featured')).toBe(false)
  // Editorial picks have featured_until NULL and must never match.
  expect(calls).toContainEqual(['not', 'featured_until', 'is', null])
  expect(calls.some((c) => c[0] === 'lt' && c[1] === 'featured_until')).toBe(true)
})
