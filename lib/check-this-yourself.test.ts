// Claude Sonnet 5.5, 2026-11-23: renders the public "Check this yourself" block and pins its wording and its limits:
// no internal level or reasons, no private check, vendor text as text, https links only.
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { CheckThisYourself } from '../app/components/CatalogSources'
import { getVerificationSource } from './verification'
import reviews from './catalog-reviews.json'
import type { RealnessRecord } from './realness'

const claims = (slug: string) => (reviews.reviews as { slug: string; claims: Record<string, unknown> }[]).find((r) => r.slug === slug)!.claims
const html = (name: string, source: ReturnType<typeof getVerificationSource>) => renderToStaticMarkup(createElement(CheckThisYourself, { name, source }))
const text = (h: string) => h.replace(/<\/(p|li|h\d|div|code|section)>/g, ' ').replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ')

describe('Check this yourself block', () => {
  const cap = html('Captain.Legal', getVerificationSource({ slug: 'captainlegal', ...claims('captainlegal') }))
  const t = text(cap)

  it('opens with the exact lead and names the vendor', () => {
    expect(t).toContain('Check this yourself')
    expect(t).toContain('LegalAIMCP is an independent directory. We do not make, sell or run Captain.Legal. Here is what we looked at, the date we looked, and how to repeat each check without us.')
  })
  it('quotes the vendor with a hostname link, a text fragment and the review date', () => {
    expect(t).toContain('What the vendor says')
    expect(t).toContain("These lines are quoted from the vendor's or maintainer's own pages. They show what is claimed, not that it is true.")
    expect(t).toContain('“Captain.Legal provides legal document templates with encoded, cited checks.”')
    expect(cap).toContain('href="https://mcp.captain.legal/docs/en/#:~:text=Captain.Legal%20provides%20legal%20document%20templates%20with%20encoded%2C%20cited%20checks.')
    expect(t).toContain('mcp.captain.legal')
    expect(t).toContain('reviewed 2026-11-22')
    expect(cap).toContain('rel="noopener noreferrer"')
  })
  it('lists only public checks, with a label, what we saw and a selectable command', () => {
    expect(t).toContain('We ran these checks ourselves on 2026-11-23. Each one shows what we saw and a command you can run to see it too.')
    for (const label of ['Website', 'Domain registration', 'Mail records', 'MCP server', 'Official MCP registry']) expect(t).toContain(label)
    expect(t).not.toContain('Code repository')
    expect(cap).toContain('<code')
    expect(cap).toContain("curl -s -X POST &#x27;https://mcp.captain.legal/connect/&#x27;")
    expect(cap).not.toContain('cloudflare-dns')
    expect(t).not.toMatch(/security DNS|resolver/i)
  })
  it('never shows the internal level or reasons', () => {
    expect(cap).not.toMatch(/watch|reasons|level/i)
  })
  it('says "Could not check" for an unknown result, and "No entry found" for a registry search with no match', () => {
    const record: RealnessRecord = { slug: 'x', checked_at: '2026-11-23', level: 'watch', reasons: [], checks: [
      { id: 'site', result: 'unknown', observed: 'The site blocks automated readers.', how_to_repeat: 'curl a', public: true },
      { id: 'registry', result: 'unknown', observed: 'No entry in the official MCP registry matched this listing. Absence proves nothing either way.', how_to_repeat: 'curl b', public: true },
      { id: 'mcp_endpoint', result: 'unknown', observed: 'timed out', how_to_repeat: 'curl c', public: true },
    ] }
    const out = text(html('X', { record, review: null, operator: null }))
    expect(out).toMatch(/Website\s*Could not check/)
    expect(out).toMatch(/Official MCP registry\s*No entry found/)
    expect(out).toMatch(/MCP server\s*Could not check/)
  })
  it('hides the MCP registry row for a listing with no MCP server (TeleWizard)', () => {
    const tw = text(html('TeleWizard', getVerificationSource({ slug: 'telewizard', ...claims('telewizard') })))
    expect(tw).not.toContain('Official MCP registry')
    expect(tw).not.toContain('MCP server')
  })
  it('says who is behind it in the three possible ways', () => {
    const review = (reviews.reviews as { slug: string }[]).find((r) => r.slug === 'captainlegal')!
    const row = { slug: 'captainlegal', ...claims('captainlegal') }
    const op = { name: 'Camines LLC', register: 'Delaware Division of Corporations', url: 'https://icis.corp.delaware.gov/', status: 'Good standing', checked_at: '2026-11-23' }
    const found = html('Captain.Legal', getVerificationSource(row, { reviews: [{ ...review, operator: op } as never] }))
    expect(text(found)).toContain('Camines LLC, listed in Delaware Division of Corporations as Good standing. Checked 2026-11-23.')
    expect(found).toContain('href="https://icis.corp.delaware.gov/"')
    const formed = text(html('Captain.Legal', getVerificationSource(row, { reviews: [{ ...review, operator: { ...op, formed: '2018-04-02' } } as never] })))
    expect(formed).toContain('Camines LLC, listed in Delaware Division of Corporations as Good standing, formed 2018-04-02. Checked 2026-11-23.')
    const missing = text(html('Captain.Legal', getVerificationSource(row, { reviews: [{ ...review, operator: { status: 'not_found', note: 'Nothing under that name.' } } as never] })))
    expect(missing).toContain('We looked for the operator in a public company register and did not find one. Nothing under that name.')
    expect(t).toContain('Who is behind it')
    // Claude Fable 5.2, 2026-11-23: the review on file now carries an operator, so the "not yet looked" case is built
    // here instead of read from live data. Before, this line passed only because no record had an operator.
    const unlooked = text(html('Captain.Legal', getVerificationSource(row, { reviews: [{ ...review, operator: undefined } as never] })))
    expect(unlooked).toContain('We have not yet looked this operator up in a company register.')
  })
  it('ends with what we did not check and the method link', () => {
    expect(t).toContain('What we did not check')
    expect(t).toContain('We did not open a customer account, use the product on a real matter, test its security, or check any legal output for accuracy. A passing check here is not a recommendation.')
    expect(cap).toContain('href="/how-we-verify"')
    expect(t).toContain('How we check listings')
  })
  it('still renders for a listing with no realness record or review', () => {
    const none = text(html('Unlisted Tool', getVerificationSource({ slug: 'no-such-listing' })))
    expect(none).toContain('Check this yourself')
    expect(none).toContain('We do not make, sell or run Unlisted Tool.')
    expect(none).toContain('Not checked yet.')
    expect(none).toContain('We have not yet looked this operator up in a company register.')
  })
  it('skips a quote marked show:false, and keeps it in the record', () => {
    const rec = (reviews.reviews as { slug: string; sources: { quote: string; show?: boolean }[] }[]).find((r) => r.slug === 'captainlegal')!
    const founder = rec.sources.find((s) => s.quote.includes('founded'))!
    expect(founder.show).toBe(false)
    const out = text(html('Captain.Legal', getVerificationSource({ slug: 'captainlegal', ...claims('captainlegal') })))
    expect(out).not.toContain('Delmotte')
    expect(out).toContain('Captain.Legal provides legal document templates')
  })
  it('renders vendor text as text and links only https', () => {
    const rec = (reviews.reviews as { slug: string }[]).find((r) => r.slug === 'captainlegal')!
    const evil = { ...rec, sources: [{ url: 'javascript:alert(1)', kind: 'vendor', sha256: 'x', quote: '<img src=x onerror=alert(1)>' }] }
    const out = html('X', getVerificationSource({ slug: 'captainlegal', ...claims('captainlegal') }, { reviews: [evil as never] }))
    expect(out).not.toContain('<img')
    expect(out).not.toContain('javascript:')
  })
  it('escapes a vendor name', () => {
    expect(html('<script>alert(1)</script>', getVerificationSource({ slug: 'none' }))).not.toContain('<script>')
  })
  it('marks warn and fail results in words, not only colour', () => {
    const record: RealnessRecord = { slug: 'x', checked_at: '2026-11-23', level: 'fail', reasons: ['internal'], checks: [
      { id: 'site', result: 'fail', observed: 'The site could not be reached.', how_to_repeat: 'curl x', public: true },
      { id: 'mail', result: 'warn', observed: 'No mail records.', how_to_repeat: 'curl y', public: true },
    ] }
    const out = text(html('X', { record, review: null, operator: null }))
    expect(out).toContain('Failed')
    expect(out).toContain('Warning')
    expect(out).not.toContain('internal')
  })
})
