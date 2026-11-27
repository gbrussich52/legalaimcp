// Grok Bot (Crack Bot), 2026-11-27, why: guards /guides/connect-claude-to-imanage. The copy must stay tied to iManage's
// own help pages, the FAQPage schema must equal the visible questions, and the page must not claim write access by default.
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Guide, { metadata } from '../app/guides/connect-claude-to-imanage/page'
import {
  IMANAGE_CONNECTORS,
  IMANAGE_GUIDE_CHECKED,
  IMANAGE_GUIDE_FAQS,
  IMANAGE_GUIDE_LEAD,
  IMANAGE_GUIDE_SOURCES,
  IMANAGE_WORK_READ_TOOLS,
  IMANAGE_WORK_WRITE_TOOLS,
} from './imanage-guide'

const html = renderToStaticMarkup(createElement(Guide))
const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]!.replace(/\\u003c/g, '<')))
const byType = (t: string) => blocks.find((b) => b['@type'] === t)

describe('/guides/connect-claude-to-imanage', () => {
  it('has one H1, a canonical and the answer-first lead', () => {
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
    expect(metadata.alternates?.canonical).toBe('https://legalaimcp.com/guides/connect-claude-to-imanage')
    expect(IMANAGE_GUIDE_LEAD).toMatch(/^To connect Claude to iManage Work/)
    expect(IMANAGE_GUIDE_LEAD).toMatch(/read permissions only/)
    expect(html).toContain('not legal advice')
  })

  it('FAQPage schema equals the visible questions and answers', () => {
    const faq = byType('FAQPage')
    expect(faq.mainEntity.map((e: { name: string }) => e.name)).toEqual(IMANAGE_GUIDE_FAQS.map((f) => f.q))
    expect(faq.mainEntity.map((e: { acceptedAnswer: { text: string } }) => e.acceptedAnswer.text)).toEqual(IMANAGE_GUIDE_FAQS.map((f) => f.a))
    for (const f of IMANAGE_GUIDE_FAQS) expect(html).toContain(f.q.replace(/'/g, '&#x27;'))
  })

  it('has Article and BreadcrumbList schema with the page URL', () => {
    expect(byType('Article').mainEntityOfPage).toBe('https://legalaimcp.com/guides/connect-claude-to-imanage')
    expect(byType('Article').dateModified).toBe(IMANAGE_GUIDE_CHECKED)
    const crumbs = byType('BreadcrumbList').itemListElement
    expect(crumbs.at(-1).item).toBe('https://legalaimcp.com/guides/connect-claude-to-imanage')
    expect(blocks.some((b) => b['@type'] === 'SoftwareApplication')).toBe(false)
  })

  it('cites only iManage help pages', () => {
    expect(IMANAGE_GUIDE_SOURCES.length).toBe(7)
    for (const s of IMANAGE_GUIDE_SOURCES) expect(new URL(s.url).host).toBe('docs.imanage.com')
  })

  it('prints the four documented connector URLs as text, not links', () => {
    expect(IMANAGE_CONNECTORS.map((c) => c.url)).toEqual([
      'https://cloudimanage.com/mcp/work',
      'https://cloudimanage.com/mcp/search',
      'https://cloudimanage.com/mcp/insightplus',
      'https://cloudimanage.com/mcp/tracker',
    ])
    expect(html).not.toMatch(/href="https:\/\/[a-z.]*cloudimanage\.com/)
  })

  it('says read is the default and names the write tools as write', () => {
    expect(html).toMatch(/Only read tools are available by default/)
    expect(IMANAGE_WORK_WRITE_TOOLS).toEqual(expect.arrayContaining(['upload_document', 'move_document', 'create_workspace']))
    for (const t of IMANAGE_WORK_WRITE_TOOLS) expect(IMANAGE_WORK_READ_TOOLS as readonly string[]).not.toContain(t)
    expect(html).not.toMatch(/full access by default|can edit by default/i)
  })

  it('links the listing and the other setup guides, and the listing, sitemap and category link back', () => {
    for (const href of ['/servers/imanage-work', '/guides/connect-claude-to-clio', '/guides/connect-claude-to-harvey', '/guides/connect-claude-to-courtlistener']) {
      expect(html).toContain(`href="${href}"`)
    }
    expect(readFileSync('app/servers/[slug]/page.tsx', 'utf8')).toContain("path: '/guides/connect-claude-to-imanage'")
    expect(readFileSync('app/sitemap.ts', 'utf8')).toContain('/guides/connect-claude-to-imanage')
    expect(readFileSync('lib/category-content.ts', 'utf8')).toContain("href: '/guides/connect-claude-to-imanage'")
    expect(readFileSync('app/components/ReviewedConnectionGuide.tsx', 'utf8')).toContain("'/guides/connect-claude-to-imanage'")
  })
})
