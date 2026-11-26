// Claude Sonnet 5.5, 2026-11-23: the /how-we-verify method page. It must say what we check and how to repeat it, make no
// claim about how often checks are re-run (no scheduled job exists yet), and use none of the words the owner
// reserves for things we have not shown.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import type { Metadata } from 'next'
import realness from './catalog-realness.json'
import { CHECK_METHODS, FAQS } from './how-we-verify'
import { CHECK_LABELS } from './verification'
import type { RealnessRecord } from './realness'

const root = resolve(__dirname, '..')
const read = (p: string) => readFileSync(resolve(root, p), 'utf8')
const flat = (h: string) => h.replace(/<\/(p|li|h\d|div|code|section|td|th|tr|dt|dd)>/g, ' ').replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ')

async function load() {
  const mod = (await import('../app/how-we-verify/page')) as { default: () => React.ReactElement; metadata: Metadata }
  const html = renderToStaticMarkup(createElement(mod.default))
  return { mod, html, text: flat(html) }
}

describe('/how-we-verify', () => {
  it('has one H1, the planned sections and a mailto for errors', async () => {
    const { html, text } = await load()
    expect(html.match(/<h1/g)).toHaveLength(1)
    expect(text).toContain('How we check listings')
    for (const h of ['We are not the vendor', 'What happens before a listing goes up', 'What each check shows', 'What we never check', 'Paid placements', 'Report an error', 'Questions']) expect(text, h).toContain(h)
    expect(html).toContain('href="mailto:hello@legalaimcp.com"')
  })
  it('has metadata inside the sitemap limits, a canonical and an og:url', async () => {
    const { mod } = await load()
    const title = `${mod.metadata.title as string} | LegalAIMCP`
    expect(title.length).toBeLessThanOrEqual(60)
    expect((mod.metadata.description as string).length).toBeGreaterThanOrEqual(110)
    expect((mod.metadata.description as string).length).toBeLessThanOrEqual(150)
    expect(mod.metadata.alternates?.canonical).toBe('https://legalaimcp.com/how-we-verify')
    expect(mod.metadata.openGraph?.url).toBe('https://legalaimcp.com/how-we-verify')
  })
  it('explains every public check id the data uses, each with what it shows, what it does not, and a command', async () => {
    const { text } = await load()
    const ids = new Set<string>()
    for (const r of Object.values(realness.records) as RealnessRecord[]) for (const c of r.checks) if (c.public) ids.add(c.id)
    for (const id of ids) {
      const row = CHECK_METHODS.find((m) => m.id === id)
      expect(row, id).toBeTruthy()
      expect(row!.label).toBe(CHECK_LABELS[id])
      expect(row!.shows.length).toBeGreaterThan(10)
      expect(row!.doesNotShow.length).toBeGreaterThan(10)
      expect(row!.howToRepeat.length).toBeGreaterThan(10)
      expect(text).toContain(row!.howToRepeat.replace(/\s+/g, ' '))
    }
    expect(CHECK_METHODS.some((m) => m.id === 'security_resolver')).toBe(false)
    expect(text).toContain('A registry entry shows control of a namespace, not quality.')
    expect(text).toContain('not who owns it')
  })
  it('states the paid-placement rule in the planned words', async () => {
    expect((await load()).text).toContain('A paid placement changes where a listing appears, not what we check. Paid listings are marked Sponsored.')
  })
  it('never uses the reserved words and never says how often checks are re-run', async () => {
    const { text } = await load()
    const all = `${text} ${JSON.stringify(FAQS)}`
    expect(all).not.toMatch(/verified|safe\b|safely|approved|trusted|guaranteed/i)
    expect(all).not.toMatch(/\b(daily|weekly|monthly|hourly|nightly|regularly|re-?run|re-?check|scheduled|every (day|week|month|hour)|automatic)/i)
    expect(all).not.toMatch(/delve|leverage|seamless|robust|unlock|elevate|streamline|game-changer|—|\s--\s/i)
    expect(text).toContain('Each listing shows the date of its last check.')
  })
  it('puts the same FAQ in the page and in the FAQPage schema', async () => {
    const { html, text } = await load()
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1].replace(/\\u003c/g, '<'))
    expect(schema['@type']).toBe('FAQPage')
    expect(schema.mainEntity).toHaveLength(FAQS.length)
    for (const f of FAQS) {
      expect(text).toContain(f.q)
      expect(text).toContain(f.a)
      expect(schema.mainEntity.find((e: { name: string }) => e.name === f.q).acceptedAnswer.text).toBe(f.a)
    }
  })
  it('is in the sitemap with a fixed date, and linked from the footer, the about page and the terms page', () => {
    const sitemap = read('app/sitemap.ts')
    expect(sitemap).toMatch(/how-we-verify/)
    expect(sitemap).toMatch(/howWeVerify: '2026-11-23'/)
    expect(sitemap).not.toMatch(/lastModified: new Date\(\)/)
    expect(read('app/components/Footer.tsx')).toContain("href: '/how-we-verify'")
    expect(read('app/about/page.tsx')).toContain('href="/how-we-verify"')
    // The terms carry an effective date and are legal text: they are not edited for this page.
    expect(read('app/terms/page.tsx')).not.toContain('how-we-verify')
    expect(sitemap).toMatch(/terms: '2026-09-19'/)
  })
  it('is pointed to by llms.txt for agents', () => {
    const llms = read('public/llms.txt')
    expect(llms).toContain('https://legalaimcp.com/how-we-verify')
    expect(llms).toMatch(/get_legal_ai_tool[^\n]*(checks|how to repeat)/)
  })
})
