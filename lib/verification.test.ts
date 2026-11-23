// Claude Sonnet 5.5, 2026-11-23: tests for the public "Check this yourself" evidence (listing block and MCP answers).
// Everything shown must come from lib/catalog-realness.json and lib/catalog-reviews.json, never from the vendor's row.
import { describe, it, expect } from 'vitest'
import realness from './catalog-realness.json'
import reviews from './catalog-reviews.json'
import { textFragmentUrl, publicChecks, getVerificationSource, buildVerification, buildVerificationSummary, CHECK_LABELS, RESULT_LABELS, METHOD_PATH, NOT_CHECKED } from './verification'
import type { RealnessRecord } from './realness'
import { SHARED_DOMAINS } from '../scripts/realness.mjs'

const claims = (slug: string) => (reviews.reviews as { slug: string; claims: Record<string, unknown> }[]).find((r) => r.slug === slug)!.claims

import { mcpUrlLabel, CODE_HOSTS } from './verification'

// The listing page said "MCP Repository" even when mcp_repo_url was a live endpoint (captainlegal).
describe('mcpUrlLabel', () => {
  it('says MCP endpoint for a vendor host and MCP Repository for a code host', () => {
    expect(mcpUrlLabel('https://mcp.captain.legal/connect/')).toBe('MCP endpoint')
    expect(mcpUrlLabel('https://postalform.com/mcp')).toBe('MCP endpoint')
    expect(mcpUrlLabel('https://github.com/a/b')).toBe('MCP Repository')
    expect(mcpUrlLabel('https://sub.github.io/x')).toBe('MCP Repository')
    expect(mcpUrlLabel('http://vendor.example/mcp')).toBe('MCP Repository')
    expect(mcpUrlLabel('not a url')).toBe('MCP Repository')
  })
  it('uses the same code-host list as the realness checker', () => {
    expect([...CODE_HOSTS].sort()).toEqual([...SHARED_DOMAINS].sort())
  })
})

describe('textFragmentUrl', () => {
  it('encodes the characters that have meaning in the text-fragment syntax', () => {
    expect(textFragmentUrl('https://a.example/p', 'Hello, world - and & more')).toBe('https://a.example/p#:~:text=Hello%2C%20world%20%2D%20and%20%26%20more')
  })
  it('encodes quotes, plus signs, percent signs and non-Latin letters', () => {
    const url = textFragmentUrl('https://a.example/', `It's 100% "free" + more é`)
    expect(url.startsWith('https://a.example/#:~:text=')).toBe(true)
    const frag = url.split('#:~:text=')[1]
    expect(frag).not.toMatch(/[\s,&+"-]/)
    expect(decodeURIComponent(frag)).toBe(`It's 100% "free" + more é`)
  })
  it('joins runs of white space the way the browser reads the page', () => {
    expect(textFragmentUrl('https://a.example/', 'one   two three')).toBe('https://a.example/#:~:text=one%20two%20three')
  })
  it('falls back to the plain URL for a long quote, a quote with a line break, an empty quote, a URL that already has a fragment, and a non-https URL', () => {
    expect(textFragmentUrl('https://a.example/', 'x'.repeat(201))).toBe('https://a.example/')
    expect(textFragmentUrl('https://a.example/', 'x'.repeat(200))).toContain('#:~:text=')
    expect(textFragmentUrl('https://a.example/', 'line one\nline two')).toBe('https://a.example/')
    expect(textFragmentUrl('https://a.example/', '   ')).toBe('https://a.example/')
    expect(textFragmentUrl('https://a.example/#top', 'hello')).toBe('https://a.example/#top')
    expect(textFragmentUrl('https://a.example/#', 'hello')).toBe('https://a.example/#')
    expect(textFragmentUrl('http://a.example/', 'hello')).toBe('http://a.example/')
  })
})

const rec = (checks: RealnessRecord['checks']): RealnessRecord => ({ slug: 's', checked_at: '2026-11-23', level: 'watch', reasons: ['internal reason'], checks })
const c = (id: string, result: RealnessRecord['checks'][number]['result'], pub = true) => ({ id, result, observed: `${id} observed`, how_to_repeat: `${id} cmd`, public: pub })

describe('publicChecks', () => {
  it('drops private checks and checks that do not apply, and keeps unknown', () => {
    const out = publicChecks(rec([c('site', 'pass'), c('security_resolver', 'pass', false), c('repo', 'not_applicable'), c('mail', 'unknown')]))
    expect(out.map((x) => x.id)).toEqual(['site', 'mail'])
  })
  it('has a plain label for every check id and result', () => {
    for (const r of Object.values(realness.records) as RealnessRecord[]) for (const k of r.checks) expect(CHECK_LABELS[k.id], k.id).toBeTruthy()
    expect(RESULT_LABELS.unknown).toBe('Could not check')
    expect(CHECK_LABELS).toMatchObject({ site: 'Website', domain_age: 'Domain registration', mail: 'Mail records', mcp_endpoint: 'MCP server', repo: 'Code repository', registry: 'Official MCP registry' })
  })
})

describe('buildVerification (get_legal_ai_tool)', () => {
  const row = { slug: 'captainlegal', ...claims('captainlegal') }
  it('states that the directory is independent and carries the checks, the date, the method page and the listing page', () => {
    const v = buildVerification(row)
    expect(v.independent).toBe(true)
    expect(v.statement).toBe('LegalAIMCP is an independent directory, not the vendor. These are the checks we ran and how to repeat them. Repeat them before you rely on this listing.')
    expect(v.checked_at).toBe('2026-11-23')
    expect(v.method_url).toBe(`https://legalaimcp.com${METHOD_PATH}`)
    expect(v.listing_url).toBe('https://legalaimcp.com/servers/captainlegal')
    expect(v.not_checked).toEqual([...NOT_CHECKED])
    expect(v.checks.map((x) => x.id)).toContain('mcp_endpoint')
    for (const k of v.checks) expect(Object.keys(k).sort()).toEqual(['how_to_repeat', 'id', 'observed', 'result'])
  })
  it('never exposes private checks, level, reasons or the machine value', () => {
    const text = JSON.stringify(buildVerification(row))
    expect(text).not.toContain('security_resolver')
    expect(text).not.toContain('cloudflare-dns')
    expect(text).not.toMatch(/"level"|"reasons"|"value"|"public"/)
  })
  it('gives an empty, undated answer for a listing with no realness record', () => {
    const v = buildVerification({ slug: 'no-such-listing' })
    expect(v).toMatchObject({ independent: true, checked_at: null, checks: [], operator: null })
  })
  it('passes an operator through only when the review matches the row, and only with https links', () => {
    const review = (reviews.reviews as { slug: string }[]).find((r) => r.slug === 'captainlegal')!
    const op = { name: 'Camines LLC', register: 'Delaware Division of Corporations', url: 'https://icis.corp.delaware.gov/', status: 'Good standing', checked_at: '2026-11-23' }
    const src = getVerificationSource(row, { reviews: [{ ...review, operator: op } as never] })
    expect(src.operator).toEqual(op)
    expect(getVerificationSource({ ...row, name: 'Changed' }, { reviews: [{ ...review, operator: op } as never] }).operator).toBeNull()
    expect(getVerificationSource(row, { reviews: [{ ...review, operator: { ...op, url: 'javascript:alert(1)' } } as never] }).operator).toBeNull()
    expect(getVerificationSource(row, { reviews: [{ ...review, operator: { status: 'not_found', note: 'Nothing under that name.' } } as never] }).operator).toEqual({ status: 'not_found', note: 'Nothing under that name.' })
  })
})

describe('buildVerificationSummary (list answers)', () => {
  it('is small: independence, date, counts by result, method page and the tool that returns the full record', () => {
    const s = buildVerificationSummary({ slug: 'captainlegal', ...claims('captainlegal') })
    expect(s.independent).toBe(true)
    expect(s.checked_at).toBe('2026-11-23')
    expect(s.method_url).toBe('https://legalaimcp.com/how-we-verify')
    expect(s.full_record_tool).toBe('get_legal_ai_tool')
    expect(s.checks_by_result).toEqual({ pass: expect.any(Number), warn: 0, fail: 0, unknown: 0 })
    expect(s.checks_by_result.pass).toBeGreaterThan(0)
    expect(JSON.stringify(s)).not.toContain('curl')
  })
  it('counts only the public checks that apply', () => {
    const s = buildVerificationSummary({ slug: 'telewizard' })
    expect(s.checks_by_result).toEqual({ pass: 3, warn: 0, fail: 0, unknown: 1 })
  })
  it('has zero counts and no date when nothing was checked', () => {
    expect(buildVerificationSummary({ slug: 'none' })).toMatchObject({ checked_at: null, checks_by_result: { pass: 0, warn: 0, fail: 0, unknown: 0 } })
  })
})
