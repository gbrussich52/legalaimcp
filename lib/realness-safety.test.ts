// Claude Sonnet 5.5, 2026-11-23: the realness checker now sees raw URLs typed by strangers, on the owner's laptop
// inside his home network. These tests pin the rules that keep a hostile URL from reaching anything private.
// Offline only: the resolver and fetch are injected, no test touches the network.
import { describe, it, expect, afterEach } from 'vitest'
import { screenUrl, upgradeHttp, isPrivateAddress, safeFetch, siteCheck, handshake, checkSubmissionItems, setDeps } from '../scripts/realness.mjs'

let restore: (() => void) | null = null
afterEach(() => { restore?.(); restore = null })

type Call = { url: string; method: string }
function inject(map: Record<string, string[]>, responder: (url: URL, init: RequestInit) => Response) {
  const calls: Call[] = []
  const resolved: string[] = []
  restore = setDeps({
    resolve: async (host: string) => { resolved.push(host); if (!map[host]) throw Object.assign(new Error('x'), { kind: 'dns' }); return map[host] },
    fetch: async (url: URL, init: RequestInit) => { calls.push({ url: String(url), method: String(init.method ?? 'GET') }); return responder(new URL(url), init) },
  })
  return { calls, resolved }
}
const ok = () => new Response('hello', { status: 200 })
const lib = { registrableDomain: (u: string) => { try { return new URL(u).hostname.split('.').slice(-2).join('.') } catch { return null } } }

describe('screenUrl: the address itself', () => {
  it('accepts a public https address and refuses plain http for GET and POST', () => {
    expect(screenUrl('https://example.com/a')).toBeNull()
    expect(screenUrl('https://www.example.co.uk/')).toBeNull()
    expect(screenUrl('http://www.example.co.uk/')).not.toBeNull()
    expect(screenUrl('http://example.com/', { method: 'GET' })).not.toBeNull()
  })
  it('refuses other schemes', () => {
    for (const u of ['ftp://example.com/', 'file:///etc/passwd', 'javascript:alert(1)', 'gopher://example.com', 'data:text/html,hi']) expect(screenUrl(u), u).not.toBeNull()
  })
  it('refuses credentials in the address', () => {
    expect(screenUrl('https://user:pw@example.com/')).not.toBeNull()
    expect(screenUrl('https://user@example.com/')).not.toBeNull()
  })
  it('refuses IP literals, including tricks that normalise to one', () => {
    for (const u of ['http://127.0.0.1/', 'http://8.8.8.8/', 'http://[::1]/', 'http://[2606:4700:4700::1111]/', 'http://2130706433/', 'http://0x7f.1/', 'http://017700000001/', 'http://[::ffff:7f00:1]/']) expect(screenUrl(u), u).not.toBeNull()
  })
  it('refuses local names and hosts with no registrable domain', () => {
    for (const u of ['http://localhost/', 'http://app.localhost/', 'http://printer.local/', 'http://db.internal/', 'http://router.lan/', 'http://nas.home.arpa/', 'http://intranet/', 'http://example.invalid/', 'https://com/', 'https://co.uk/']) expect(screenUrl(u), u).not.toBeNull()
  })
  it('refuses an unreadable address', () => {
    expect(screenUrl('not a url')).not.toBeNull()
    expect(screenUrl('')).not.toBeNull()
  })
  it('allows POST only to https', () => {
    expect(screenUrl('http://example.com/mcp', { method: 'POST' })).not.toBeNull()
    expect(screenUrl('https://example.com/mcp', { method: 'POST' })).toBeNull()
  })
})

// Claude Sonnet 5.5, 2026-11-23: HTTPS only, so a rebound DNS answer dies at the certificate check before anything is sent.
describe('https only', () => {
  it('upgrades an http input to https on the same host, port and path before the first request', async () => {
    const { calls } = inject({ 'example.com': ['93.184.216.34'] }, ok)
    const r = await safeFetch('http://example.com/a?b=1')
    expect(r.status).toBe(200)
    expect(calls.map((c) => c.url)).toEqual(['https://example.com/a?b=1'])
    expect(upgradeHttp('http://example.com:8080/x')).toBe('https://example.com:8080/x')
    expect(upgradeHttp('https://example.com/')).toBe('https://example.com/')
  })
  it('refuses a redirect hop to http and never requests it', async () => {
    const { calls } = inject({ 'example.com': ['93.184.216.34'], 'other.example.net': ['93.184.216.35'] }, () => new Response(null, { status: 302, headers: { location: 'http://other.example.net/x' } }))
    await expect(safeFetch('https://example.com/')).rejects.toMatchObject({ kind: 'private' })
    expect(calls.map((c) => c.url)).toEqual(['https://example.com/'])
  })
  it('never hands a plain-http request to the injected fetch', async () => {
    const { calls } = inject({ 'example.com': ['93.184.216.34'] }, (url) =>
      url.hostname === 'example.com' && url.pathname === '/' ? new Response(null, { status: 302, headers: { location: '/next' } }) : ok())
    await safeFetch('http://example.com/')
    await expect(safeFetch('http://example.com/mcp', { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' }) })).resolves.toBeDefined()
    expect(calls.length).toBeGreaterThan(0)
    for (const c of calls) expect(String(c.url).startsWith('https://'), String(c.url)).toBe(true)
  })
  it('treats an upgraded address that does not answer as an ordinary site fail', async () => {
    inject({ 'example.com': ['93.184.216.34'] }, () => { throw Object.assign(new Error('refused'), { cause: { code: 'ECONNREFUSED' } }) })
    const r = await siteCheck('http://example.com/', { lib })
    expect(r.result).toBe('fail')
    expect(r.observed).not.toBe('The address is not a public web address.')
  })
})

describe('isPrivateAddress: what a name resolves to', () => {
  it('refuses every reserved range, v4 and v6', () => {
    for (const ip of ['0.0.0.0', '10.0.0.1', '127.0.0.1', '100.64.0.1', '100.127.255.255', '169.254.169.254', '172.16.0.1', '172.31.0.1', '192.168.1.1', '224.0.0.1', '239.255.255.255', '::', '::1', 'fe80::1', 'febf::1', 'fc00::1', 'fd12::1', 'ff02::1', '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:a00:1', '::ffff:c0a8:101', '::127.0.0.1', '64:ff9b::7f00:1']) expect(isPrivateAddress(ip), ip).toBe(true)
  })
  it('allows public addresses', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '172.32.0.1', '100.128.0.1', '2606:4700:4700::1111', '::ffff:808:808']) expect(isPrivateAddress(ip), ip).toBe(false)
  })
})

describe('safeFetch: resolve before any request', () => {
  it('sends no request when any resolved address is private', async () => {
    const { calls } = inject({ 'mixed.example.com': ['8.8.8.8', '10.0.0.5'] }, ok)
    await expect(safeFetch('https://mixed.example.com/')).rejects.toMatchObject({ kind: 'private' })
    expect(calls).toEqual([])
  })
  it('sends no request for an unsafe address and never resolves it', async () => {
    const { calls, resolved } = inject({}, ok)
    await expect(safeFetch('http://127.0.0.1/')).rejects.toMatchObject({ kind: 'private' })
    await expect(safeFetch('https://user:pw@example.com/')).rejects.toMatchObject({ kind: 'private' })
    expect(calls).toEqual([])
    expect(resolved).toEqual([])
  })
  it('fetches a public host', async () => {
    const { calls } = inject({ 'example.com': ['93.184.216.34'] }, ok)
    const r = await safeFetch('https://example.com/')
    expect(r.status).toBe(200)
    expect(calls).toHaveLength(1)
  })
  it('applies the same test to every redirect hop, by hand', async () => {
    const { calls } = inject({ 'example.com': ['93.184.216.34'], 'evil.example.net': ['192.168.1.10'] }, (url) =>
      url.hostname === 'example.com' ? new Response(null, { status: 302, headers: { location: 'https://evil.example.net/x' } }) : ok())
    await expect(safeFetch('https://example.com/')).rejects.toMatchObject({ kind: 'private' })
    expect(calls.map((c) => c.url)).toEqual(['https://example.com/'])
  })
  it('refuses a redirect to an IP literal or to a local name without resolving it', async () => {
    for (const target of ['http://169.254.169.254/latest/meta-data/', 'http://localhost:8080/', 'file:///etc/passwd']) {
      const { calls } = inject({ 'example.com': ['93.184.216.34'] }, () => new Response(null, { status: 301, headers: { location: target } }))
      await expect(safeFetch('https://example.com/'), target).rejects.toMatchObject({ kind: 'private' })
      expect(calls).toHaveLength(1)
      restore?.(); restore = null
    }
  })
  it('stops after 5 redirects', async () => {
    const { calls } = inject({ 'example.com': ['93.184.216.34'] }, () => new Response(null, { status: 302, headers: { location: 'https://example.com/again' } }))
    await expect(safeFetch('https://example.com/')).rejects.toMatchObject({ kind: 'redirects' })
    expect(calls).toHaveLength(6)
  })
  it('passes redirect: manual and a timeout signal on every request', async () => {
    let init: RequestInit | undefined
    restore = setDeps({ resolve: async () => ['93.184.216.34'], fetch: async (_u: URL, i: RequestInit) => { init = i; return ok() } })
    await safeFetch('https://example.com/')
    expect(init?.redirect).toBe('manual')
    expect(init?.signal).toBeInstanceOf(AbortSignal)
  })
  it('caps the body at the given size', async () => {
    inject({ 'example.com': ['93.184.216.34'] }, () => new Response('x'.repeat(5000), { status: 200 }))
    const r = await safeFetch('https://example.com/', { cap: 1000 })
    expect(r.text.length).toBeLessThanOrEqual(1000)
  })
  it('never follows a redirect on POST', async () => {
    const { calls } = inject({ 'example.com': ['93.184.216.34'] }, () => new Response(null, { status: 307, headers: { location: 'https://example.com/b' } }))
    const r = await safeFetch('https://example.com/mcp', { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }) })
    expect(r.status).toBe(307)
    expect(calls).toHaveLength(1)
  })
})

describe('the only POSTs are the handshake', () => {
  it('refuses a POST that is not initialize or server/discover', async () => {
    const { calls } = inject({ 'example.com': ['93.184.216.34'] }, ok)
    for (const m of ['tools/call', 'tools/list', 'resources/read']) {
      await expect(safeFetch('https://example.com/mcp', { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: m }) }), m).rejects.toBeTruthy()
    }
    await expect(safeFetch('https://example.com/mcp', { method: 'POST', body: 'not json' })).rejects.toBeTruthy()
    await expect(safeFetch('https://example.com/x', { method: 'PUT', body: '{}' })).rejects.toBeTruthy()
    await expect(safeFetch('https://example.com/x', { method: 'DELETE' })).rejects.toBeTruthy()
    expect(calls).toEqual([])
  })
  it('handshake sends initialize only (then discover once) and nothing else', async () => {
    const methods: string[] = []
    inject({ 'example.com': ['93.184.216.34'] }, (_u, init) => { methods.push(JSON.parse(String(init.body)).method); return new Response('{"jsonrpc":"2.0","error":{"code":-32601,"message":"no"},"id":1}', { status: 400 }) })
    const ctx = { lib: { parseAuthChallenge: () => null, parseHandshakeBody: () => null, parseDiscoverBody: () => null, isJsonRpcError: () => true } }
    await handshake('https://example.com/mcp', ctx)
    expect(methods).toEqual(['initialize', 'server/discover'])
  })
})

describe('a refused URL is a plain fail', () => {
  it('siteCheck says so in one sentence and sends nothing', async () => {
    const { calls } = inject({}, ok)
    const r = await siteCheck('http://169.254.169.254/', { lib })
    expect(r).toMatchObject({ id: 'site', result: 'fail', observed: 'The address is not a public web address.' })
    expect(calls).toEqual([])
  })
  it('siteCheck fails when the name resolves to a private address', async () => {
    const { calls } = inject({ 'vendor.example.com': ['10.1.1.1'] }, ok)
    const r = await siteCheck('https://vendor.example.com/', { lib })
    expect(r).toMatchObject({ result: 'fail', observed: 'The address is not a public web address.' })
    expect(calls).toEqual([])
  })
  it('handshake on a private endpoint is a fail with the same sentence', async () => {
    const { calls } = inject({ 'mcp.example.com': ['127.0.0.1'] }, ok)
    const r = await handshake('https://mcp.example.com/mcp', { lib })
    expect(r).toMatchObject({ id: 'mcp_endpoint', result: 'fail', observed: 'The address is not a public web address.' })
    expect(calls).toEqual([])
  })
})

describe('--submission items', () => {
  const realLib = { registrableDomain: () => null, judge: (checks: { id: string; result: string }[]) => ({ level: checks.some((c) => c.result === 'fail') ? 'fail' : 'pass', reasons: checks.some((c) => c.result === 'fail') ? ['the site could not be reached'] : [] }) }
  it('returns ref, level, reasons and bare check ids for each item, with no vendor text', async () => {
    inject({}, ok)
    const ctx = { today: '2026-11-23', lib: realLib, cache: { rdap: {}, repo: {} }, memo: new Map(), ghLimited: false, bootstrap: null }
    const out = await checkSubmissionItems([{ ref: 'sub-1', name: 'Evil', url: 'http://127.0.0.1/', repo_url: null }], ctx)
    expect(out).toEqual({ checked: 1, results: [{ ref: 'sub-1', level: 'fail', reasons: ['the site could not be reached'], checks: [{ id: 'site', result: 'fail' }] }] })
  })
  it('refuses a malformed file', async () => {
    const ctx = { today: '2026-11-23', lib: realLib, cache: { rdap: {}, repo: {} }, memo: new Map() }
    await expect(checkSubmissionItems([{ ref: 1 }] as never, ctx)).rejects.toThrow()
    await expect(checkSubmissionItems(Array.from({ length: 201 }, (_, i) => ({ ref: `r${i}`, name: 'n', url: 'https://a.com', repo_url: null })), ctx)).rejects.toThrow()
  })
})
