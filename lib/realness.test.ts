// Claude Sonnet 5.5, 2026-11-23: tests for the "is this vendor real" checks. Written before lib/realness.ts.
// Pure logic only: no network. Network probes live in scripts/realness.mjs.
import { describe, it, expect } from 'vitest'
import {
  registrableDomain, parseRdapRegistration, parseRegistryMatch, parseHandshakeBody, parseDiscoverBody, isJsonRpcError, parseAuthChallenge, judge,
  type Check,
} from './realness'

const chk = (id: string, result: Check['result'], extra: Partial<Check> = {}): Check => ({
  id, result, observed: `${id} ${result}`, how_to_repeat: 'curl -sI https://example.com', public: true, ...extra,
})
const TODAY = '2026-11-23'
// A clean set: everything passes and the domain is old.
const clean = (): Check[] => [
  chk('site', 'pass'), chk('domain_age', 'pass', { value: '2018-07-06' }), chk('mail', 'pass'),
  chk('security_resolver', 'pass', { public: false }), chk('mcp_endpoint', 'not_applicable'),
  chk('repo', 'not_applicable'), chk('registry', 'unknown'),
]
const daysAgo = (n: number) => new Date(Date.parse(`${TODAY}T00:00:00Z`) - n * 86400000).toISOString().slice(0, 10)
const swap = (id: string, replacement: Check) => clean().map(c => (c.id === id ? replacement : c))

describe('registrableDomain', () => {
  it('reduces a host to its registrable domain', () => {
    expect(registrableDomain('https://www.vaquill.ai/')).toBe('vaquill.ai')
    expect(registrableDomain('https://mcp.courtlistener.com/x')).toBe('courtlistener.com')
  })
  it('handles two-level suffixes', () => {
    expect(registrableDomain('https://app.ailex.co.jp/mcp')).toBe('ailex.co.jp')
    expect(registrableDomain('https://lexery.com.ua')).toBe('lexery.com.ua')
    expect(registrableDomain('https://docs.example.co.uk/a')).toBe('example.co.uk')
  })
  it('accepts a bare host and returns null for junk or an IP', () => {
    expect(registrableDomain('Sub.Example.COM')).toBe('example.com')
    expect(registrableDomain('not a url at all')).toBeNull()
    expect(registrableDomain('https://127.0.0.1/x')).toBeNull()
  })
  it('keeps shared hosts as their own registrable domain', () => {
    expect(registrableDomain('https://awslabs.github.io/mcp')).toBe('github.io')
  })
})

describe('parseRdapRegistration', () => {
  it('reads the registration event', () => {
    const json = { events: [{ eventAction: 'last changed', eventDate: '2025-01-01T00:00:00Z' }, { eventAction: 'registration', eventDate: '2024-02-24T10:11:12Z' }] }
    expect(parseRdapRegistration(json)).toBe('2024-02-24')
  })
  it('returns null when there is no usable registration date', () => {
    expect(parseRdapRegistration({ events: [] })).toBeNull()
    expect(parseRdapRegistration({})).toBeNull()
    expect(parseRdapRegistration(null)).toBeNull()
    expect(parseRdapRegistration({ events: [{ eventAction: 'registration', eventDate: 'soon' }] })).toBeNull()
    expect(parseRdapRegistration({ events: [{ eventAction: 'registration', eventDate: '2999-01-01T00:00:00Z' }] }, '2026-11-23')).toBeNull()
  })
})

describe('parseRegistryMatch', () => {
  const entry = (name: string, url: string, publishedAt = '2026-09-27T12:00:00Z') => ({
    server: { name, remotes: [{ type: 'streamable-http', url }] },
    _meta: { 'io.modelcontextprotocol.registry/official': { publishedAt } },
  })
  it('matches on the endpoint host', () => {
    const json = { servers: [entry('com.postalform/postalform', 'https://postalform.com/mcp')] }
    expect(parseRegistryMatch(json, { endpointHost: 'postalform.com', domain: 'postalform.com' })).toEqual({ namespace: 'com.postalform/postalform', since: '2026-09-27' })
  })
  it('matches on the reverse-domain namespace when the endpoint differs', () => {
    const json = { servers: [entry('com.vendor/thing', 'https://elsewhere.net/mcp')] }
    expect(parseRegistryMatch(json, { endpointHost: null, domain: 'vendor.com' })?.namespace).toBe('com.vendor/thing')
  })
  it('does not match a look-alike namespace or a different host', () => {
    const json = { servers: [entry('com.vendorx/thing', 'https://other.net/mcp'), entry('io.github.vendor/x', 'https://other.net/mcp')] }
    expect(parseRegistryMatch(json, { endpointHost: 'vendor.com', domain: 'vendor.com' })).toBeNull()
  })
  it('returns null for empty or malformed answers', () => {
    expect(parseRegistryMatch({ servers: [] }, { endpointHost: 'a.com', domain: 'a.com' })).toBeNull()
    expect(parseRegistryMatch('x', { endpointHost: 'a.com', domain: 'a.com' })).toBeNull()
  })
})

describe('parseHandshakeBody', () => {
  const result = { jsonrpc: '2.0', id: 1, result: { protocolVersion: '2025-06-18', serverInfo: { name: 'postalform', version: '0.1.0' } } }
  it('reads plain JSON', () => {
    expect(parseHandshakeBody(JSON.stringify(result))).toEqual({ serverName: 'postalform', version: '0.1.0' })
  })
  it('reads an SSE data: body', () => {
    const sse = `event: message\ndata: ${JSON.stringify(result)}\n\n`
    expect(parseHandshakeBody(sse)).toEqual({ serverName: 'postalform', version: '0.1.0' })
  })
  it('skips SSE lines that are not the initialize answer', () => {
    const sse = `data: {"jsonrpc":"2.0","method":"ping"}\n\ndata: ${JSON.stringify(result)}\n\n`
    expect(parseHandshakeBody(sse)?.serverName).toBe('postalform')
  })
  it('returns null for errors, HTML and garbage', () => {
    expect(parseHandshakeBody('<html>hi</html>')).toBeNull()
    expect(parseHandshakeBody('{"jsonrpc":"2.0","id":1,"error":{"code":-32600,"message":"bad"}}')).toBeNull()
    expect(parseHandshakeBody('')).toBeNull()
    expect(parseHandshakeBody('data: {not json')).toBeNull()
  })
  it('tolerates a missing version and caps long text', () => {
    const r = parseHandshakeBody(JSON.stringify({ result: { serverInfo: { name: 'x'.repeat(500) } } }))
    expect(r?.serverName.length).toBeLessThanOrEqual(80)
    expect(r?.version).toBe('')
  })
})

// The 2026-07-28 draft spec (modelcontextprotocol.io/specification/draft/server/discover): the server's own name
// and version sit in result._meta["io.modelcontextprotocol/serverInfo"].
describe('parseDiscoverBody', () => {
  const result = { jsonrpc: '2.0', id: 'discover-1', result: { resultType: 'complete', supportedVersions: ['2026-07-28'], _meta: { 'io.modelcontextprotocol/serverInfo': { name: 'ExampleServer', version: '1.0.0' } } } }
  it('reads the draft discover answer, plain or SSE', () => {
    expect(parseDiscoverBody(JSON.stringify(result))).toEqual({ serverName: 'ExampleServer', version: '1.0.0' })
    expect(parseDiscoverBody(`data: ${JSON.stringify(result)}\n\n`)).toEqual({ serverName: 'ExampleServer', version: '1.0.0' })
  })
  it('returns null without serverInfo, for errors and for HTML', () => {
    expect(parseDiscoverBody(JSON.stringify({ result: { supportedVersions: [] } }))).toBeNull()
    expect(parseDiscoverBody('<html></html>')).toBeNull()
  })
})
describe('isJsonRpcError', () => {
  it('recognizes a JSON-RPC error body, so a modern 404 is not mistaken for a dead endpoint', () => {
    expect(isJsonRpcError('{"jsonrpc":"2.0","id":1,"error":{"code":-32601,"message":"Method not found"}}')).toBe(true)
    expect(isJsonRpcError('data: {"jsonrpc":"2.0","error":{"code":-32600,"message":"x"}}')).toBe(true)
  })
  it('rejects HTML, empty bodies and plain results', () => {
    expect(isJsonRpcError('<html>404</html>')).toBe(false)
    expect(isJsonRpcError('')).toBe(false)
    expect(isJsonRpcError('{"jsonrpc":"2.0","id":1,"result":{}}')).toBe(false)
  })
})

describe('parseAuthChallenge', () => {
  it('treats 401 and 403 with WWW-Authenticate as sign-in required', () => {
    expect(parseAuthChallenge(401, 'Bearer realm="mcp"')).toBe(true)
    expect(parseAuthChallenge(403, 'Bearer')).toBe(true)
  })
  it('does not treat a bare 403, or other statuses, as a challenge', () => {
    expect(parseAuthChallenge(403, null)).toBe(false)
    expect(parseAuthChallenge(200, 'Bearer')).toBe(false)
    expect(parseAuthChallenge(404, 'Bearer')).toBe(false)
  })
})

describe('judge', () => {
  it('passes a clean set', () => {
    const r = judge(clean(), TODAY)
    expect(r.level).toBe('pass')
    expect(r.reasons).toEqual([])
  })
  it('fails when the site cannot be reached', () => {
    const r = judge(swap('site', chk('site', 'fail')), TODAY)
    expect(r.level).toBe('fail')
    expect(r.reasons.join(' ')).toMatch(/site/i)
  })
  it('does not fail a site that blocks automated readers', () => {
    expect(judge(swap('site', chk('site', 'unknown')), TODAY).level).toBe('pass')
  })
  it('fails a domain registered under 30 days ago and watches one under 180', () => {
    expect(judge(swap('domain_age', chk('domain_age', 'pass', { value: daysAgo(5) })), TODAY).level).toBe('fail')
    expect(judge(swap('domain_age', chk('domain_age', 'pass', { value: daysAgo(29) })), TODAY).level).toBe('fail')
    expect(judge(swap('domain_age', chk('domain_age', 'pass', { value: daysAgo(30) })), TODAY).level).toBe('watch')
    expect(judge(swap('domain_age', chk('domain_age', 'pass', { value: daysAgo(179) })), TODAY).level).toBe('watch')
    expect(judge(swap('domain_age', chk('domain_age', 'pass', { value: daysAgo(180) })), TODAY).level).toBe('pass')
  })
  it('watches an unknown registration date', () => {
    const r = judge(swap('domain_age', chk('domain_age', 'unknown')), TODAY)
    expect(r.level).toBe('watch')
    expect(r.reasons.join(' ')).toMatch(/registration date/i)
  })
  it('watches a domain without mail records', () => {
    expect(judge(swap('mail', chk('mail', 'warn')), TODAY).level).toBe('watch')
  })
  it('fails when the security resolver blocks the domain', () => {
    expect(judge(swap('security_resolver', chk('security_resolver', 'fail', { public: false })), TODAY).level).toBe('fail')
  })
  it('fails when a listed endpoint is gone and watches when it could not be checked', () => {
    expect(judge(swap('mcp_endpoint', chk('mcp_endpoint', 'fail')), TODAY).level).toBe('fail')
    expect(judge(swap('mcp_endpoint', chk('mcp_endpoint', 'unknown')), TODAY).level).toBe('watch')
    expect(judge(swap('mcp_endpoint', chk('mcp_endpoint', 'pass')), TODAY).level).toBe('pass')
  })
  it('says the address is not public, not that the endpoint is gone, when the MCP address was refused', () => {
    const refusedCheck = chk('mcp_endpoint', 'fail', { observed: 'The address is not a public web address.' })
    expect(judge(swap('mcp_endpoint', refusedCheck), TODAY).reasons).toEqual(['the listed MCP address is not a public web address'])
    expect(judge(swap('mcp_endpoint', chk('mcp_endpoint', 'fail')), TODAY).reasons).toEqual(['the listed MCP endpoint is gone'])
  })
  it('never lets registry absence or a repo warning worsen the level', () => {
    expect(judge(swap('registry', chk('registry', 'unknown')), TODAY).level).toBe('pass')
    expect(judge(swap('repo', chk('repo', 'warn')), TODAY).level).toBe('pass')
  })
  it('keeps the worst level and lists every reason', () => {
    const checks = clean().map(c => c.id === 'site' ? chk('site', 'fail') : c.id === 'mail' ? chk('mail', 'warn') : c)
    const r = judge(checks, TODAY)
    expect(r.level).toBe('fail')
    expect(r.reasons.length).toBe(2)
  })
  it('accepts a Date for today', () => {
    expect(judge(clean(), new Date('2026-11-23T08:00:00Z')).level).toBe('pass')
  })
})
