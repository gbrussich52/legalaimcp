// Claude Sonnet 5.5, 2026-11-23: offline tests for the pure helpers in scripts/realness.mjs (address rules, endpoint
// detection, stable output, change report). Written after the script; the network probes are exercised by the real run.
import { describe, it, expect } from 'vitest'
import { isPrivateAddress, isEndpointUrl, endpointOf, serialize, diffRecords } from '../scripts/realness.mjs'

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
