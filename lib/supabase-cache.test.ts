import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchPublicCatalog, CATALOG_CACHE_REVISION } from './supabase'

describe('public catalog cache boundary', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('bounds public GET/HEAD freshness while retaining request headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'))
    vi.stubGlobal('fetch', fetchMock)
    for (const method of ['GET', 'HEAD']) {
      await fetchPublicCatalog('https://example.test/listings', { method, headers: { accept: 'application/json' } })
      const options = fetchMock.mock.lastCall![1]
      expect(options.cache).toBe('force-cache')
      expect(options.next.revalidate).toBeGreaterThan(0)
      expect(options.next.revalidate).toBeLessThanOrEqual(300)
      expect(options.headers.accept).toBe('application/json')
      expect(options.headers['x-client-info']).toContain(`catalog/${CATALOG_CACHE_REVISION}`)
    }
  })
  it('preserves SDK/authentication headers while separating the corrected read cache', async () => {
    const fetchMock=vi.fn().mockResolvedValue(new Response('{}'));vi.stubGlobal('fetch',fetchMock)
    await fetchPublicCatalog(new Request('https://example.test/listings',{headers:{authorization:'Bearer fictional-test','x-client-info':'supabase-js/test'}}))
    expect(fetchMock.mock.lastCall![1].headers).toMatchObject({authorization:'Bearer fictional-test','x-client-info':`supabase-js/test; catalog/${CATALOG_CACHE_REVISION}`})
  })
  it('never caches submission mutations, including Request objects', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'))
    vi.stubGlobal('fetch', fetchMock)
    for (const method of ['POST', 'PATCH', 'DELETE']) {
      await fetchPublicCatalog('https://example.test/submissions', { method, body: '{}' })
      expect(fetchMock.mock.lastCall![1]).toMatchObject({ cache: 'no-store', next: { revalidate: 0 }, body: '{}' })
    }
    await fetchPublicCatalog(new Request('https://example.test/submissions', { method: 'POST' }))
    expect(fetchMock.mock.lastCall![1]).toMatchObject({ cache: 'no-store', next: { revalidate: 0 } })
  })
})
