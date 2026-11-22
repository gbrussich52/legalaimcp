// Claude Opus 5.5, 2026-11-22: tests for the new-listing admission path (scripts/catalog-admit.mjs).
// Written before the module. No network, no database: fetch is mocked and SQL is inspected as text.
import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import * as gate from './catalog-review'
import { checkPlan, buildSQL, mergeRecords, verifyReadback, escapeJsonAscii, hostOf, siteKey } from '../scripts/catalog-admit.mjs'

const NOW = new Date('2026-11-22T15:00:00Z')
const SRC_URL = 'https://vendor.example.com/docs'
const SRC_BODY = '<main><h1>Acme Draft</h1><p>Acme Draft reviews contract clauses against your playbook.</p></main>'
const QUOTE = 'Acme Draft reviews contract clauses against your playbook.'
const SUB_A = '11111111-1111-4111-8111-111111111111'
const SUB_B = '22222222-2222-4222-8222-222222222222'
const SUB_C = '33333333-3333-4333-8333-333333333333'

const baseListing = () => ({
  name: 'Acme Draft',
  tagline: 'Contract clause review against your playbook.',
  description: 'Acme Draft reviews contract clauses against a firm playbook. Documentation reviewed; no customer account was tested.',
  category: 'document_processing',
  external_url: 'https://www.acme-draft.example.com/product',
  mcp_repo_url: '',
  mcp_install_command: '',
  pricing_model: 'contact',
  pricing_details: 'Contact Acme for pricing.',
  tags: ['contract-review', 'playbook'],
  creator_name: 'Acme',
  creator_url: 'https://acme-draft.example.com',
  logo_url: null,
  firm_size_fit: [],
})
const baseAdmit = () => ({
  submission_ids: [SUB_A],
  listing: baseListing(),
  identity_confirmed: true, capabilities_confirmed: true, mcp_confirmed: false,
  sources: [{ url: SRC_URL, kind: 'vendor', quote: QUOTE }],
})
const plan = (over: Record<string, unknown> = {}) => ({ reviewed_at: '2026-11-22', reviewer: 'Test reviewer', admit: [baseAdmit()], reject: [], ...over })
const policy = () => ({ reviews: [] as unknown[], blocked_slugs: ['billbot-legal'], blocked_domains: ['deadlinewatch.com'] })
const pages: Record<string, string> = { [SRC_URL]: SRC_BODY }
const fetcher = (async (input: URL | string) => new Response(pages[String(input)] ?? 'missing', { status: pages[String(input)] ? 200 : 404 })) as typeof fetch
const run = (p: unknown, opts: Record<string, unknown> = {}) => checkPlan(p, { gate, policy: policy(), fetcher, now: NOW, ...opts })
const reasonOf = async (p: unknown, opts: Record<string, unknown> = {}) => {
  const out = await run(p, opts)
  expect(out.ok).toBe(false)
  return out.results.filter((r: { ok: boolean }) => !r.ok).map((r: { reason: string }) => r.reason).join(' | ')
}
const withListing = (over: Record<string, unknown>) => plan({ admit: [{ ...baseAdmit(), listing: { ...baseListing(), ...over } }] })

describe('admission check', () => {
  it('passes a clean item and builds a record the real gate accepts', async () => {
    const out = await run(plan())
    expect(out.results.map((r: { reason: string }) => r.reason)).toEqual(['ok'])
    expect(out.ok).toBe(true)
    const [item] = out.admits
    expect(item.slug).toBe('acme-draft')
    await expect(gate.assertCatalogReview(item.record.claims, { reviews: [item.record], fetcher, now: NOW })).resolves.toBeUndefined()
  })

  it('uses the same slug rule as the admin Approve button', async () => {
    for (const name of ['Cool Legal Tool', '<script>alert(1)</script> Tool', 'A  --  B__c', ' Leading-and-trailing- ']) {
      const out = await run(withListing({ name: name.padEnd(2, 'x') }), { fetchSources: false })
      const row = out.results[0]
      const admit = out.admits[0]
      if (admit) expect(admit.slug).toBe(gate.generateSlug(name.padEnd(2, 'x')))
      else expect(row.reason).not.toContain('slug')
    }
  })

  it('enforces the submit form bounds', async () => {
    const cases: Array<[Record<string, unknown>, string]> = [
      [{ name: 'A' }, 'name'], [{ name: 'x'.repeat(101) }, 'name'], [{ name: 'Acme <b>' }, 'name'],
      [{ tagline: 'too short' }, 'tagline'], [{ tagline: 'x'.repeat(121) }, 'tagline'],
      [{ description: 'short' }, 'description'], [{ description: 'x'.repeat(2001) }, 'description'],
      [{ category: 'astrology' }, 'category'], [{ pricing_model: 'cheap' }, 'pricing_model'],
      [{ external_url: 'http://acme.example.com' }, 'external_url'], [{ external_url: 'javascript:alert(1)' }, 'external_url'],
      [{ mcp_repo_url: 'ftp://x.example.com' }, 'mcp_repo_url'], [{ creator_url: 'http://acme.example.com' }, 'creator_url'],
      [{ creator_name: 'A' }, 'creator_name'], [{ tags: 'a,b' }, 'tags'], [{ firm_size_fit: ['giant'] }, 'firm_size_fit'],
    ]
    for (const [over, field] of cases) expect(await reasonOf(withListing(over), { fetchSources: false })).toContain(field)
  })

  it('refuses control characters but not real non-ASCII text', async () => {
    expect(await reasonOf(withListing({ description: 'Acme Draft reviews contract clauses.\u0000 Documentation reviewed only, nothing tested.' }), { fetchSources: false })).toContain('control')
    const out = await run(withListing({ name: 'Acme Dráft 合同', tagline: 'Contract clause review, the firm’s playbook.' }), { fetchSources: false })
    expect(out.ok).toBe(true)
  })

  it('refuses a blocked slug and a blocked domain', async () => {
    expect(await reasonOf(withListing({ name: 'BillBot Legal' }), { fetchSources: false })).toContain('blocked slug')
    expect(await reasonOf(withListing({ external_url: 'https://www.deadlinewatch.com/x' }), { fetchSources: false })).toContain('blocked domain')
  })

  it('refuses duplicate slugs and duplicate submission ids inside one file', async () => {
    const twice = plan({ admit: [baseAdmit(), { ...baseAdmit(), submission_ids: [SUB_B] }] })
    expect(await reasonOf(twice, { fetchSources: false })).toContain('duplicate slug')
    const ids = plan({ reject: [{ submission_ids: [SUB_A], notes: 'Duplicate of an existing listing.' }] })
    expect(await reasonOf(ids, { fetchSources: false })).toContain('duplicate submission id')
  })

  it('refuses a slug that already has a review record', async () => {
    const out = await checkPlan(plan(), { gate, policy: { ...policy(), reviews: [{ slug: 'acme-draft' }] }, fetcher, now: NOW, fetchSources: false })
    expect(out.ok).toBe(false)
    expect(out.results[0].reason).toContain('already has a review record')
  })

  it('accepts an identical checked-in record, so --sql and --verify-readback still run after --write-records', async () => {
    const first = await run(plan())
    const record = first.admits[0].record
    const again = await checkPlan(plan(), { gate, policy: { ...policy(), reviews: [record] }, fetcher, now: NOW })
    expect(again.results[0].reason).toContain('matches the checked-in record')
    expect(again.admits[0].recorded).toBe(true)
    const changed = await checkPlan(plan(), { gate, policy: { ...policy(), reviews: [{ ...record, reviewer: 'Someone else' }] }, fetcher, now: NOW })
    expect(changed.ok).toBe(false)
  })

  it('needs 1 to 5 sources with quotes of at least 15 normalized characters', async () => {
    expect(await reasonOf(plan({ admit: [{ ...baseAdmit(), sources: [] }] }), { fetchSources: false })).toContain('source')
    const six = Array.from({ length: 6 }, () => ({ url: SRC_URL, kind: 'vendor', quote: QUOTE }))
    expect(await reasonOf(plan({ admit: [{ ...baseAdmit(), sources: six }] }), { fetchSources: false })).toContain('source')
    expect(await reasonOf(plan({ admit: [{ ...baseAdmit(), sources: [{ url: SRC_URL, kind: 'vendor', quote: '  <b>short</b>   quote ' }] }] }), { fetchSources: false })).toContain('quote')
    expect(await reasonOf(plan({ admit: [{ ...baseAdmit(), sources: [{ url: SRC_URL, kind: 'directory', quote: QUOTE }] }] }), { fetchSources: false })).toContain('kind')
  })

  it('normalizes absent values to null and empty arrays, as catalog_claims() and existing records do', async () => {
    const out = await run(plan())
    const claims = out.admits[0].record.claims
    expect(claims.mcp_repo_url).toBeNull()
    expect(claims.mcp_install_command).toBeNull()
    expect(claims.logo_url).toBeNull()
    expect(claims.firm_size_fit).toEqual([])
  })

  it('fails when the quote is absent from the source', async () => {
    const p = plan({ admit: [{ ...baseAdmit(), sources: [{ url: SRC_URL, kind: 'vendor', quote: 'Calculates statutes of limitations everywhere.' }] }] })
    expect(await reasonOf(p)).toContain('quote')
  })

  it('fails a redirecting or oversized source and fetches without following redirects', async () => {
    const seen: RequestInit[] = []
    const redirecting = (async (_u: URL | string, init?: RequestInit) => { seen.push(init ?? {}); return new Response(null, { status: 302, headers: { location: 'https://elsewhere.example.com' } }) }) as typeof fetch
    expect(await reasonOf(plan(), { fetcher: redirecting })).toContain('unavailable')
    expect(seen[0].redirect).toBe('error')
    const huge = (async () => new Response('x'.repeat(2_000_001))) as typeof fetch
    expect(await reasonOf(plan(), { fetcher: huge })).toContain('size limit')
  })

  it('prints one line per item, including rejects', async () => {
    const out = await run(plan({ reject: [{ submission_ids: [SUB_C], notes: 'Not a legal product.' }] }))
    expect(out.results).toHaveLength(2)
    expect(out.results.every((r: { ok: boolean }) => r.ok)).toBe(true)
  })

  it('builds a record with exactly the key set of an existing record', async () => {
    const existing = JSON.parse(await readFile(resolve(__dirname, 'catalog-reviews.json'), 'utf8')).reviews[0]
    const out = await run(plan())
    const record = out.admits[0].record
    expect(Object.keys(record)).toEqual(Object.keys(existing))
    expect(Object.keys(record.claims)).toEqual(Object.keys(existing.claims))
    expect(Object.keys(record.sources[0])).toEqual(Object.keys(existing.sources[0]))
  })
})

describe('SQL pack', () => {
  const evil = "O'Brien \\ $$ $admit_aaaaaaaaaaaaaaaa$ '); drop table x; --"
  const checked = async () => {
    const p = plan({ admit: [{ ...baseAdmit(), listing: { ...baseListing(), pricing_details: evil } }], reject: [{ submission_ids: [SUB_C], notes: evil }] })
    const out = await run(p)
    expect(out.ok).toBe(true)
    return out
  }
  const literal = (sql: string, tag: string) => {
    const start = sql.indexOf(tag) + tag.length
    return sql.slice(start, sql.indexOf(tag, start))
  }

  it('keeps hostile text inside one dollar-quoted jsonb literal and regenerates a colliding tag', async () => {
    const out = await checked()
    const tags = ['aaaaaaaaaaaaaaaa', 'bbbbbbbbbbbbbbbb', 'cccccccccccccccc', 'dddddddddddddddd', 'eeeeeeeeeeeeeeee']
    let i = 0
    const sql = buildSQL(out, { random: () => tags[Math.min(i++, tags.length - 1)] })
    expect(sql.dataTag).not.toBe('$admit_aaaaaaaaaaaaaaaa$')
    for (const file of [sql.guard, sql.apply, sql.rollback, sql.readback]) {
      expect(file.split(sql.dataTag).length - 1).toBe(2)
      const parsed = JSON.parse(literal(file, sql.dataTag))
      expect(JSON.stringify(parsed)).toContain(JSON.stringify(evil).slice(1, -1))
    }
    const parsed = JSON.parse(literal(sql.apply, sql.dataTag))
    expect(parsed.admit[0].listing.pricing_details).toBe(evil)
    expect(parsed.reject[0].notes).toBe(evil)
  })

  it('never deletes or drops, and the rollback file differs only in its last statement', async () => {
    const sql = buildSQL(await run(plan()))
    for (const file of [sql.guard, sql.apply, sql.rollback, sql.readback]) expect(file).not.toMatch(/\b(delete|drop|truncate)\b/i)
    expect(sql.apply.trimEnd().endsWith('commit;')).toBe(true)
    expect(sql.rollback.trimEnd().endsWith('rollback;')).toBe(true)
    expect(sql.rollback.replace(/rollback;\s*$/, '')).toBe(sql.apply.replace(/commit;\s*$/, ''))
    expect(sql.apply).toMatch(/lock_timeout/)
    expect(sql.apply).toMatch(/statement_timeout/)
    expect(sql.apply).toMatch(/legalaimcp\.catalog_claims\(/)
    expect(sql.apply).toMatch(/'submitted'/)
    expect(sql.apply).toMatch(/get diagnostics/i)
  })

  it('only touches pending submissions when rejecting', async () => {
    const sql = buildSQL(await run(plan({ reject: [{ submission_ids: [SUB_C], notes: 'Not a legal product.' }] })))
    const rejectUpdate = sql.apply.match(/update legalaimcp\.submissions[\s\S]*?'rejected'[\s\S]*?;/i)?.[0] ?? ''
    expect(rejectUpdate).toMatch(/status\s*=\s*'pending'/)
    for (const update of sql.apply.match(/update legalaimcp\.submissions[\s\S]*?;/gi) ?? []) expect(update).toMatch(/status\s*=\s*'pending'/)
  })

  it('writes pure ASCII SQL whose literal parses back to the original non-ASCII strings', async () => {
    const name = 'Acme Dráft 合同'
    const tagline = 'Contract clause review, the firm’s playbook.'
    const quote = 'Acme Dráft reviews the firm’s contract clauses (合同审查).'
    const url = 'https://vendor.example.com/intl'
    const intlFetch = (async () => new Response(`<p>${quote}</p>`)) as typeof fetch
    const p = plan({ admit: [{ ...baseAdmit(), listing: { ...baseListing(), name, tagline }, sources: [{ url, kind: 'vendor', quote }] }] })
    const out = await run(p, { fetcher: intlFetch })
    expect(out.results[0].reason).toBe('ok')
    const sql = buildSQL(out)
    for (const file of [sql.guard, sql.apply, sql.rollback, sql.readback]) expect(/^[\x00-\x7f]*$/.test(file)).toBe(true)
    const parsed = JSON.parse(literal(sql.apply, sql.dataTag))
    expect(parsed.admit[0].listing.name).toBe(name)
    expect(parsed.admit[0].listing.tagline).toBe(tagline)
    expect(parsed.admit[0].review.sources[0].quote).toBe(quote)
    // The checked-in record keeps the real characters, like the existing Vincent record does.
    const merged = mergeRecords(await readFile(resolve(__dirname, 'catalog-reviews.json'), 'utf8'), [out.admits[0].record])
    expect(merged).toContain(name)
    expect(merged).toContain(quote)
    expect(merged).not.toContain('\\u5408')
  })

  it('escapes astral characters as surrogate pairs and refuses NUL', () => {
    expect(escapeJsonAscii(JSON.stringify('a😀b'))).toBe('"a\\ud83d\\ude00b"')
    expect(JSON.parse(escapeJsonAscii(JSON.stringify('a😀b')))).toBe('a😀b')
    expect(() => escapeJsonAscii(JSON.stringify('a\u0000b'))).toThrow()
  })

  it('compares hosts without www and case', () => {
    expect(hostOf('https://WWW.Acme.example.com/a?b')).toBe('acme.example.com')
  })

  // Claude Sonnet 5.5, 2026-11-22: shared code hosts must compare by repo path, not bare host.
  it('keys shared code hosts by owner/repo and ordinary sites by host', () => {
    expect(siteKey('https://github.com/TCoder920/open-legal-compliance-mcp')).not.toBe(siteKey('https://github.com/someone/uk-legal-skills'))
    const same = ['https://github.com/Foo/Bar', 'https://www.github.com/foo/bar/', 'https://GitHub.com/foo/bar.git', 'https://github.com/foo/bar?tab=readme', 'https://github.com/foo/bar#readme', 'https://github.com/foo/bar/tree/main']
    expect(new Set(same.map(siteKey))).toEqual(new Set(['github.com/foo/bar']))
    expect(siteKey('https://www.acme.example.com/a')).toBe(siteKey('https://acme.example.com/b/c?x#y'))
    expect(siteKey('https://acme.example.com/a')).toBe('acme.example.com')
    expect(siteKey('https://github.com/')).toBe('github.com/')
    expect(siteKey('https://github.com/foo')).toBe('github.com/foo')
    expect(siteKey('https://github.com/')).not.toBe(siteKey('https://github.com/foo/bar'))
    expect(siteKey('https://gitlab.com/g/sub/proj')).toBe('gitlab.com/g/sub')
    expect(siteKey('https://pypi.org/project/Foo/1.0/')).toBe('pypi.org/project/foo')
  })

  it('accepts two different GitHub repos in one plan and refuses the same repo twice', async () => {
    const item = (url: string, name: string, sub: string) => ({ ...baseAdmit(), submission_ids: [sub], listing: { ...baseListing(), name, external_url: url } })
    const ok = plan({ admit: [item('https://github.com/a/one', 'Repo One', SUB_A), item('https://github.com/a/two', 'Repo Two', SUB_B)] })
    expect((await run(ok, { fetchSources: false })).ok).toBe(true)
    const dup = plan({ admit: [item('https://github.com/a/one', 'Repo One', SUB_A), item('https://www.github.com/A/one.git', 'Repo Two', SUB_B)] })
    expect(await reasonOf(dup, { fetchSources: false })).toContain('already')
    const site = plan({ admit: [item('https://v.example.com/a', 'Repo One', SUB_A), item('https://v.example.com/b', 'Repo Two', SUB_B)] })
    expect(await reasonOf(site, { fetchSources: false })).toContain('already')
  })

  it('writes the site-key expression into guard.sql and apply.sql, not a bare host comparison', async () => {
    const sql = buildSQL(await run(plan()))
    for (const text of [sql.guard, sql.apply]) {
      expect(text).toContain("'github.com'")
      expect(text).toContain('[.]git$')
      expect(text).not.toMatch(/'\^www\[\.\]', ''\) = /)
      expect(text).not.toMatch(/[^\x00-\x7f]/)
    }
  })
})

describe('write-records', () => {
  it('inserts in slug order, keeps every other byte, and refuses an existing slug', async () => {
    const file = await readFile(resolve(__dirname, 'catalog-reviews.json'), 'utf8')
    const out = await run(plan())
    const record = out.admits[0].record
    const merged = mergeRecords(file, [record])
    const parsed = JSON.parse(merged)
    const slugs = parsed.reviews.map((r: { slug: string }) => r.slug)
    expect(slugs).toEqual([...slugs].sort())
    expect(slugs).toContain('acme-draft')
    parsed.reviews = parsed.reviews.filter((r: { slug: string }) => r.slug !== 'acme-draft')
    expect(JSON.stringify(parsed, null, 2) + '\n').toBe(file)
    const existing = JSON.parse(file).reviews[0]
    expect(() => mergeRecords(file, [{ ...record, slug: existing.slug }])).toThrow(/already/)
  })
})

describe('readback verification', () => {
  it('round-trips the fingerprint of a row as the database returns it', async () => {
    const out = await run(plan({ reject: [{ submission_ids: [SUB_C], notes: 'Not a legal product.' }] }))
    const claims = out.admits[0].record.claims
    // to_jsonb(listings row): arrays stay arrays, nulls stay null, extra columns present.
    const row = { id: '99999999-9999-4999-8999-999999999999', ...claims, status: 'published', verified: false, source: 'submitted', tags: [...claims.tags], firm_size_fit: [] }
    const readback = [{ readback: { listings: [row], submissions: [{ id: SUB_A, status: 'approved' }, { id: SUB_C, status: 'rejected' }] } }]
    expect(verifyReadback(out, readback, gate)).toEqual({ ok: true, problems: [] })
    const drifted = [{ readback: { listings: [{ ...row, tags: null, pricing_details: 'changed' }], submissions: [{ id: SUB_A, status: 'pending' }, { id: SUB_C, status: 'rejected' }] } }]
    const bad = verifyReadback(out, drifted, gate)
    expect(bad.ok).toBe(false)
    expect(bad.problems.join(' ')).toMatch(/fingerprint/)
    expect(bad.problems.join(' ')).toMatch(/pending/)
  })
})
