import { describe, it, expect } from 'vitest'
import { assertCatalogReview, catalogFingerprint, sourceFingerprint } from './catalog-review'

const listing = { slug: 'real-tool', name: 'Real Tool MCP', tagline: 'Search published decisions.', description: 'Search published court decisions with the maintainer MCP server.', external_url: 'https://vendor.example/tool', mcp_repo_url: null, mcp_install_command: null }
const source = '<main>Real Tool provides an MCP server to search published court decisions.</main>'
const now = new Date('2026-10-27T23:00:00Z')
const approved = () => ({ slug: listing.slug, decision: 'approved', reviewed_at: '2026-10-27', reviewer: 'Test reviewer', listing_sha256: catalogFingerprint(listing), identity_confirmed: true, capabilities_confirmed: true, mcp_confirmed: true, sources: [{ url: 'https://vendor.example/docs', kind: 'vendor', sha256: sourceFingerprint(source), quote: 'provides an MCP server to search published court decisions' }] })
const fetcher = async () => new Response(source)

describe('publication evidence gate', () => {
  it('blocks an HTTP-200 product with no claim review', async () => {
    await expect(assertCatalogReview(listing, { reviews: [], fetcher, now })).rejects.toThrow('source review')
  })
  it('accepts the exact reviewed copy with matching primary-source evidence', async () => {
    await expect(assertCatalogReview(listing, { reviews: [approved()], fetcher, now })).resolves.toBeUndefined()
  })
  it('blocks changed capabilities, links, prices and install commands', async () => {
    for (const change of [{ description: 'Calculates court deadlines.' }, { external_url: 'https://unrelated.example' }, { pricing_details: 'Free forever' }, { mcp_install_command: 'npx invented-package' }]) {
      await expect(assertCatalogReview({ ...listing, ...change }, { reviews: [approved()], fetcher, now })).rejects.toThrow('changed')
    }
  })
  it('blocks expired and future-dated reviews', async () => {
    for (const reviewed_at of ['2026-01-01', '2026-11-01', '2026-02-30', 'invalid']) {
      await expect(assertCatalogReview(listing, { reviews: [{ ...approved(), reviewed_at }], fetcher, now })).rejects.toThrow('date')
    }
  })
  it('blocks contradictory or changed source pages even if HTTP 200', async () => {
    await expect(assertCatalogReview(listing, { reviews: [approved()], fetcher: async () => new Response('We do not have an MCP server.'), now })).rejects.toThrow('source changed')
  })
  it('blocks unreadable and failing sources', async () => {
    await expect(assertCatalogReview(listing, { reviews: [approved()], fetcher: async () => new Response('Forbidden', { status: 403 }), now })).rejects.toThrow('source unavailable')
  })
  it('requires explicit identity, capability and MCP review', async () => {
    for (const field of ['identity_confirmed', 'capabilities_confirmed', 'mcp_confirmed']) {
      await expect(assertCatalogReview(listing, { reviews: [{ ...approved(), [field]: false }], fetcher, now })).rejects.toThrow('confirmed')
    }
  })
  it('does not accept search results or directory pages as primary evidence', async () => {
    const review = approved(); review.sources[0].kind = 'directory'
    await expect(assertCatalogReview(listing, { reviews: [review], fetcher, now })).rejects.toThrow('primary')
  })
  it('blocks the reported domain even under a new slug or www alias', async () => {
    await expect(assertCatalogReview({ ...listing, slug: 'different-name', external_url: 'https://www.deadlinewatch.com/anything' }, { reviews: [approved()], fetcher, now })).rejects.toThrow('misattribution')
  })
  it('requires the supporting quote to exist in the captured source', async () => {
    const review = approved(); review.sources[0].quote = 'Calculates statutes of limitations'
    await expect(assertCatalogReview(listing, { reviews: [review], fetcher, now })).rejects.toThrow('quote')
  })
  it('bounds source downloads even without a Content-Length header', async () => {
    await expect(assertCatalogReview(listing, { reviews: [approved()], fetcher: async () => new Response('x'.repeat(2_000_001)), now })).rejects.toThrow('size limit')
  })
  it('does not fetch a submitted URL when no trusted review exists', async () => {
    let calls = 0
    await expect(assertCatalogReview({ ...listing, external_url: 'http://127.0.0.1/private' }, { reviews: [], fetcher: async () => { calls++; return new Response(source) }, now })).rejects.toThrow('source review')
    expect(calls).toBe(0)
  })
  it('requires MCP evidence when only a repository or installation field asserts MCP', async () => {
    const plain = { ...listing, name: 'Real Tool', description: 'Search published decisions.', mcp_repo_url: 'https://github.com/maintainer/adapter' }
    const review = { ...approved(), listing_sha256: catalogFingerprint(plain), mcp_confirmed: false }
    await expect(assertCatalogReview(plain, { reviews: [review], fetcher, now })).rejects.toThrow('confirmed')
  })
})
