// Claude Sonnet 5.5, 2026-11-23: offline tests for the pure helpers in scripts/realness.mjs (address rules, endpoint
// detection, stable output, change report). Written after the script; the network probes are exercised by the real run.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { isPrivateAddress, isEndpointUrl, endpointOf, endpointCandidates, firstReadable, summaryJson, namesMcpServer, registryCheck, serialize, diffRecords } from '../scripts/realness.mjs'

describe('isPrivateAddress', () => {
  it('refuses private, loopback, link-local and mapped addresses', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '192.168.0.9', '172.16.0.1', '172.31.255.1', '169.254.169.254', '0.0.0.0', '100.64.0.1', '::1', 'fe80::1', 'fd00::1', '::ffff:10.0.0.1', 'not-an-ip']) expect(isPrivateAddress(ip), ip).toBe(true)
  })
  it('allows public addresses', () => {
    for (const ip of ['8.8.8.8', '172.32.0.1', '1.1.1.1', '2606:4700:4700::1111']) expect(isPrivateAddress(ip), ip).toBe(false)
  })
})
describe('endpoint detection', () => {
  it('accepts remote MCP addresses and rejects repos and docs pages', () => {
    expect(isEndpointUrl('https://postalform.com/mcp')).toBe(true)
    expect(isEndpointUrl('https://app.ailex.co.jp/mcp')).toBe(true)
    expect(isEndpointUrl('https://mcp.courtlistener.com/')).toBe(true)
    expect(isEndpointUrl('https://github.com/awslabs/mcp/tree/main/src/x')).toBe(false)
    expect(isEndpointUrl('https://mcp.captain.legal/connect/')).toBe(false)
    expect(isEndpointUrl('http://postalform.com/mcp')).toBe(false)
  })
  it('finds the address on the listing, not the marketing page', () => {
    expect(endpointOf({ external_url: 'https://merit.legal/mcp', mcp_repo_url: 'https://law.merit.legal/mcp' })?.url).toBe('https://law.merit.legal/mcp')
    expect(endpointOf({ external_url: 'https://merit.legal/mcp', mcp_repo_url: null })).toBeNull()
    expect(endpointOf({ external_url: 'https://mcp.courtlistener.com/', mcp_repo_url: 'https://github.com/a/b' })?.source).toBe('external_url')
  })
})
// Claude Sonnet 5.5, 2026-11-23: captainlegal declares https://mcp.captain.legal/connect/ in mcp_repo_url and it
// answers the handshake, but the path rule skipped it and the bare host was probed, so the record said unknown.
describe('declared endpoint', () => {
  const captain = { external_url: 'https://mcp.captain.legal/', mcp_repo_url: 'https://mcp.captain.legal/connect/', mcp_install_command: null }
  it('takes mcp_repo_url on a vendor host whatever its path, and tries it first', () => {
    expect(endpointOf(captain)?.url).toBe('https://mcp.captain.legal/connect/')
    expect(endpointCandidates(captain).map((c) => c.url)).toEqual(['https://mcp.captain.legal/connect/', 'https://mcp.captain.legal/'])
  })
  it('does not treat a code host URL as an endpoint', () => {
    expect(endpointCandidates({ external_url: 'https://x.com/', mcp_repo_url: 'https://github.com/a/b/tree/main/src' })).toEqual([])
    expect(endpointCandidates({ external_url: 'https://x.com/', mcp_repo_url: 'http://x.com/mcp' })).toEqual([])
  })
  it('lists each address once', () => {
    expect(endpointCandidates({ external_url: 'https://a.com/', mcp_repo_url: 'https://a.com/mcp', mcp_install_command: 'claude mcp add --transport http a https://a.com/mcp' }).map((c) => c.url)).toEqual(['https://a.com/mcp'])
  })
  const res = (result: string, tag: string) => ({ id: 'mcp_endpoint', result, observed: tag, how_to_repeat: 'h', public: true })
  it('moves on when a candidate cannot be read, and settles on unknown only when all are unknown', async () => {
    const cands = [{ url: 'https://a/1', source: 'mcp_repo_url' }, { url: 'https://a/2', source: 'external_url' }]
    const seen: string[] = []
    const probe = (map: Record<string, string>) => async (url: string) => { seen.push(url); return res(map[url], url) }
    expect((await firstReadable(cands, probe({ 'https://a/1': 'unknown', 'https://a/2': 'pass' }))).observed).toBe('https://a/2')
    seen.length = 0
    expect((await firstReadable(cands, probe({ 'https://a/1': 'pass', 'https://a/2': 'pass' }))).observed).toBe('https://a/1')
    expect(seen).toEqual(['https://a/1'])
    expect((await firstReadable(cands, probe({ 'https://a/1': 'unknown', 'https://a/2': 'unknown' }))).observed).toBe('https://a/1')
  })
})

// Claude Sonnet 5.5, 2026-11-23: the coordinator's daily runner parses this script, so --json prints one object with a fixed shape.
describe('--json summary', () => {
  const r = (slug: string, level: string, reasons: string[], results: Record<string, string> = { site: 'pass' }) => ({ slug, checked_at: 'd', level, reasons, checks: Object.entries(results).map(([id, result]) => ({ id, result, observed: 'o', how_to_repeat: 'h', public: true })) })
  const fresh = { a: r('a', 'fail', ['the site could not be reached', 'x'], { site: 'fail' }), b: r('b', 'watch', ['the domain is under 180 days old (40 days)']), c: r('c', 'pass', []) }
  it('has checked, findings (fail only), watch and an empty changed list outside --check', () => {
    expect(summaryJson(Object.values(fresh), null)).toEqual({
      checked: 3,
      findings: [{ slug: 'a', level: 'fail', reason: 'the site could not be reached; x' }],
      watch: [{ slug: 'b', reason: 'the domain is under 180 days old (40 days)' }],
      changed: [],
    })
  })
  it('lists check results that moved, only in --check mode', () => {
    const before = { a: r('a', 'pass', [], { site: 'pass' }), b: r('b', 'watch', []), c: r('c', 'pass', []) }
    expect(summaryJson(Object.values(fresh), before).changed).toEqual([{ slug: 'a', check: 'site', from: 'pass', to: 'fail' }])
  })
})

// Claude Sonnet 5.5, 2026-11-23: a listing that names no MCP endpoint and no code repository is not an MCP server,
// so the MCP registry check does not apply to it (TeleWizard).
describe('registry applies only to MCP servers', () => {
  it('knows when a listing names an endpoint, a repository or an install command', () => {
    expect(namesMcpServer({ external_url: 'https://telewizard.ai/x', mcp_repo_url: null, mcp_install_command: null })).toBe(false)
    expect(namesMcpServer({ external_url: 'https://a.com/', mcp_repo_url: 'https://mcp.captain.legal/connect/' })).toBe(true)
    expect(namesMcpServer({ external_url: 'https://a.com/', mcp_repo_url: 'https://github.com/o/r' })).toBe(true)
    expect(namesMcpServer({ external_url: 'https://github.com/o/r', mcp_repo_url: null })).toBe(true)
    expect(namesMcpServer({ external_url: 'https://a.com/', mcp_install_command: 'npx -y some-mcp' })).toBe(true)
  })
  const searchReturns = (body: unknown) => vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })))
  const tw = { external_url: 'https://telewizard.ai/x', mcp_repo_url: null, mcp_install_command: null }
  afterEach(() => vi.unstubAllGlobals())
  it('is not_applicable for a listing with no MCP server when the registry has no match', async () => {
    searchReturns({ servers: [] })
    const r = await registryCheck(tw, { lib: { registrableDomain: () => 'telewizard.ai', parseRegistryMatch: () => null } })
    expect(r).toMatchObject({ id: 'registry', result: 'not_applicable' })
  })
  it('stays unknown for a listing that names a server and has no match', async () => {
    searchReturns({ servers: [] })
    const r = await registryCheck({ ...tw, mcp_repo_url: 'https://github.com/o/r' }, { lib: { registrableDomain: () => 'telewizard.ai', parseRegistryMatch: () => null } })
    expect(r.result).toBe('unknown')
  })
  it('keeps a real registry match as pass even when the listing names no server', async () => {
    searchReturns({ servers: [] })
    const r = await registryCheck(tw, { lib: { registrableDomain: () => 'telewizard.ai', parseRegistryMatch: () => ({ namespace: 'ai.telewizard/x', since: '2026-01-01' }) } })
    expect(r.result).toBe('pass')
  })
})

describe('output', () => {
  const rec = (slug: string, level = 'pass', result = 'pass') => ({ slug, checked_at: '2026-11-23', level, reasons: [], checks: [{ id: 'site', result, observed: 'o', how_to_repeat: 'h', public: true }] })
  it('sorts keys so diffs stay small', () => {
    const text = serialize({ b: rec('b'), a: rec('a') }, '2026-11-23')
    expect(Object.keys(JSON.parse(text).records)).toEqual(['a', 'b'])
    expect(text.endsWith('\n')).toBe(true)
  })
  it('reports what changed and ignores the check date', () => {
    const before = { a: rec('a'), c: rec('c') }
    const after = { a: { ...rec('a', 'fail', 'fail'), checked_at: '2026-11-24' }, b: rec('b') }
    const out = diffRecords(before, after).join('\n')
    expect(out).toMatch(/CHANGED a: level pass -> fail/)
    expect(out).toMatch(/NEW b/)
    expect(out).toMatch(/GONE c/)
    expect(diffRecords({ a: rec('a') }, { a: { ...rec('a'), checked_at: '2030-01-01' } })).toEqual([])
  })
})
