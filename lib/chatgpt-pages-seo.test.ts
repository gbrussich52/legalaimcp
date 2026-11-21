// Claude Sonnet 5.5, 2026-11-19: guards the Ahrefs 11/19 fixes: /chatgpt pages carry a description, Open Graph and X card
// tags (og:url = canonical), the checklist keeps noindex but follows links, and /best roundups render Article JSON-LD.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { CHATGPT_PAGES, chatgptSocialTags, type ChatgptPath } from './chatgpt-information'
import { GET as privacy } from '../app/chatgpt/privacy/route'
import { GET as support } from '../app/chatgpt/support/route'
import { GET as widget } from '../app/chatgpt/route'
import { RoundupArticleJsonLd } from '../app/components/JsonLd'
import { metadata as checklist } from '../app/checklist/page'

const paths = Object.keys(CHATGPT_PAGES) as ChatgptPath[]

describe('/chatgpt pages: social tags', () => {
  for (const path of paths) {
    it(`${path} description is 110-155 chars and tags are complete`, () => {
      const { description } = CHATGPT_PAGES[path]
      expect(description.length).toBeGreaterThanOrEqual(110)
      expect(description.length).toBeLessThanOrEqual(155)
      const tags = chatgptSocialTags(path)
      for (const key of ['name="description"', 'property="og:title"', 'property="og:description"', 'property="og:type"', 'property="og:image"', 'property="og:image:width"', 'property="og:image:height"', 'property="og:image:alt"', 'name="twitter:card"']) {
        expect(tags, key).toContain(key)
      }
      expect(tags).toContain(`<meta property="og:url" content="https://legalaimcp.com${path}">`)
    })
  }
  it('the rendered responses carry the tags', async () => {
    for (const [path, res] of [['/chatgpt/privacy', privacy()], ['/chatgpt/support', support()], ['/chatgpt', await widget()]] as const) {
      const html = await (res as Response).text()
      expect(html, path).toContain(`property="og:url" content="https://legalaimcp.com${path}"`)
      expect(html, path).toContain('name="description"')
      expect(html, path).toContain('name="twitter:card"')
    }
  })
})

describe('sitemap lists the /chatgpt pages', () => {
  it('imports CHATGPT_PAGES and never uses new Date() for them', () => {
    const src = readFileSync(new URL('../app/sitemap.ts', import.meta.url), 'utf8')
    expect(src).toContain('CHATGPT_PAGES')
    for (const p of paths) expect(CHATGPT_PAGES[p].modified).toMatch(/^2026-\d\d-\d\d$/)
  })
})

describe('/checklist robots', () => {
  it('keeps noindex and follows links', () => {
    expect(checklist.robots).toEqual({ index: false, follow: true })
  })
})

describe('/best roundup Article schema', () => {
  it('renders an Article with real dates and the site publisher, and no rating', () => {
    const html = renderToStaticMarkup(createElement(RoundupArticleJsonLd, { headline: 'H', description: 'D', path: '/best/x' }))
    const json = JSON.parse(html.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''))
    expect(json['@type']).toBe('Article')
    expect(json.datePublished).toMatch(/^\d{4}-\d\d-\d\d$/)
    expect(json.dateModified).toMatch(/^\d{4}-\d\d-\d\d$/)
    expect(json.publisher['@id']).toBe('https://legalaimcp.com/#organization')
    expect(json.aggregateRating).toBeUndefined()
  })
  for (const f of ['app/best/[slug]/page.tsx', 'app/best/legal-mcp-servers/page.tsx']) {
    it(`${f} renders RoundupArticleJsonLd`, () => {
      expect(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')).toContain('<RoundupArticleJsonLd')
    })
  }
})
