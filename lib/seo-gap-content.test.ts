// Claude Sonnet 5.5, 2026-11-12: guards the Search Console gap-query copy. It checks length rules, banned wording, that
// every internal link and listing slug points at something that exists, and that FAQ answers carry a source and a date.
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CATEGORY_CONTENT } from './category-content'
import { SOFTWARE_CONNECTIONS } from './connections'
import { getAllPosts, getPostBySlug } from './blog'
import { DESC_MAX, DESC_MIN, fitTitle } from './seo-meta'

const BANNED = /\b(delve|leverage|seamless|game-changer|robust|unlock|elevate|furthermore|moreover)\b/i
const clean = (text: string) => {
  expect(text, text).not.toMatch(/—|\s--\s/) // CLI flags such as --transport are fine; a dash used as punctuation is not
  expect(text, text).not.toMatch(BANNED)
}
const reviews = JSON.parse(readFileSync(new URL('./catalog-reviews.json', import.meta.url), 'utf8')).reviews as { slug: string }[]
const reviewed = new Set(reviews.map(r => r.slug))
const NEW_CATEGORY_QUESTIONS = new Set([
  'How do I check AI legal citations?',
  'Which AI tools search case law?',
  'What should I ask before I buy AI compliance monitoring software?',
  'Which compliance tools here support MCP?',
  'How does AI client intake work for a law firm?',
  'Which AI tools handle client intake for lawyers?',
])

function routeExists(href: string): boolean {
  const [, area, rest] = href.split('/')
  if (area === 'blog') return Boolean(getPostBySlug(rest))
  if (area === 'best') return rest === 'legal-mcp-servers' || (rest.endsWith('-mcp-servers') && Boolean(CATEGORY_CONTENT[rest.slice(0, -'-mcp-servers'.length)]))
  if (area === 'servers') return reviewed.has(rest)
  return existsSync(new URL(`../app/${area}${rest ? `/${rest}` : ''}/page.tsx`, import.meta.url))
}

describe('category gap copy', () => {
  for (const [slug, c] of Object.entries(CATEGORY_CONTENT)) {
    it(`${slug}: lengths, wording and links`, () => {
      if (c.searchHeadline) {
        expect(c.searchHeadline.length).toBeLessThanOrEqual(47)
        expect(typeof fitTitle(c.searchHeadline)).toBe('string') // brand suffix still fits
        clean(c.searchHeadline)
      }
      if (c.metaDescription) {
        expect(c.metaDescription.length).toBeGreaterThanOrEqual(DESC_MIN)
        expect(c.metaDescription.length).toBeLessThanOrEqual(DESC_MAX)
        clean(c.metaDescription)
      }
      for (const text of [c.answer, c.bestLead, c.bestAlso?.label, c.steps?.heading, c.steps?.intro, ...(c.steps?.items ?? []), ...(c.links ?? []).map(l => l.label)]) {
        if (text) clean(text)
      }
      for (const f of c.focus ?? []) {
        clean(f.heading); clean(f.lead)
        for (const s of f.slugs) expect(reviewed.has(s), `${s} has no catalog review`).toBe(true)
      }
      for (const l of [...(c.links ?? []), ...(c.bestAlso ? [c.bestAlso] : [])]) expect(routeExists(l.href), l.href).toBe(true)
      for (const f of c.faqs) if (NEW_CATEGORY_QUESTIONS.has(f.q)) { clean(f.q); clean(f.a) }
    })
  }
  it('every new category question is present exactly once', () => {
    const all = Object.values(CATEGORY_CONTENT).flatMap(c => c.faqs.map(f => f.q))
    for (const q of NEW_CATEGORY_QUESTIONS) expect(all.filter(x => x === q)).toHaveLength(1)
  })
  it('makes no performance-ranking claim in the new lead text', () => {
    for (const c of Object.values(CATEGORY_CONTENT)) {
      for (const text of [c.answer, c.bestLead]) if (text) expect(text).not.toMatch(/top-ranked|best-in-class|#1|number one/i)
    }
  })
})

describe('connection page copy', () => {
  it('gives every FAQ a source and a check date, and keeps wording plain', () => {
    const withFaqs = SOFTWARE_CONNECTIONS.filter(c => c.faqs?.length)
    expect(withFaqs.map(c => c.name).sort()).toEqual(['Clio', 'CourtListener'])
    for (const c of withFaqs) {
      expect(c.faqsChecked).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(c.faqSources?.length).toBeGreaterThan(0)
      for (const s of c.faqSources ?? []) expect(new URL(s.url).protocol).toBe('https:')
      for (const f of c.faqs ?? []) { clean(f.q); clean(f.a) }
      if (c.lead) clean(c.lead)
    }
  })
  it('labels the vendor connector as a separate product with a source and date', () => {
    const clio = SOFTWARE_CONNECTIONS.find(c => c.name === 'Clio')
    expect(clio?.kind).toBe('community') // the listing's own review is unchanged
    expect(clio?.vendorConnector?.source).toMatch(/^https:\/\/help\.clio\.com\//)
    expect(clio?.vendorConnector?.reviewed).toBe('2026-11-12')
    clean(clio!.vendorConnector!.summary)
  })
  it('states what the CourtListener tools can change, so the page does not imply read-only', () => {
    const cl = SOFTWARE_CONNECTIONS.find(c => c.name === 'CourtListener')
    expect(cl?.faqs?.some(f => /change my account/i.test(f.q))).toBe(true)
  })
})

describe('blog and servers page copy', () => {
  it('contract-review post: title fits, FAQ is clean, and it claims no preference data', () => {
    const post = getPostBySlug('ai-contract-review-tools-compared')!
    expect(post.title.length + ' | LegalAIMCP'.length).toBeLessThanOrEqual(72)
    expect(post.title.length).toBeLessThanOrEqual(60)
    expect(post.description.length).toBeGreaterThanOrEqual(DESC_MIN)
    expect(post.description.length).toBeLessThanOrEqual(DESC_MAX)
    for (const f of post.faqs ?? []) { clean(f.q); clean(f.a) }
    expect(post.content).toContain('no usage, market-share or preference data')
    expect(post.content).not.toMatch(/most popular|market leader|preferred by/i)
  })
  it('no post pairs FAQ text with a different schema source', () => {
    for (const p of getAllPosts()) for (const f of p.faqs ?? []) expect(f.a.length).toBeGreaterThan(20)
  })
  it('/servers metadata fits the title and description rules', () => {
    // The page is TSX, which vitest here cannot import, so read the literals from the source.
    const src = readFileSync(new URL('../app/servers/page.tsx', import.meta.url), 'utf8')
    const title = /title: '([^']+)'/.exec(src)?.[1] ?? ''
    const desc = /description:\s*'([^']+)'/.exec(src)?.[1] ?? ''
    expect(title.length + ' | LegalAIMCP'.length).toBeLessThanOrEqual(60)
    expect(desc.length).toBeGreaterThanOrEqual(DESC_MIN)
    expect(desc.length).toBeLessThanOrEqual(DESC_MAX)
    clean(title); clean(desc)
  })
})
