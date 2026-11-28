// Claude Opus 5.5, 2026-11-27: /ai-disclosure, its memo, the listing label and the pricing tier. The pages must cite
// their sources with the read date, say they are not legal advice, show only the fictional vendor, keep the paid tier
// off the Featured checkout, and use no dashes or stock AI phrases in copy.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement, type ReactElement } from 'react'
import { DISCLOSURE_SOURCES } from './ai-disclosure'
import { AiDisclosureLabel } from '../app/components/AiDisclosureLabel'

const root = resolve(__dirname, '..')
const read = (p: string) => readFileSync(resolve(root, p), 'utf8')
const flat = (h: string) => h.replace(/<\/(p|li|h\d|div|section|td|th|tr|dt|dd|span|a|option)>/g, ' ').replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ')

const FILES = [
  'lib/ai-disclosure.ts',
  'lib/ai-disclosure-mcp.ts',
  'app/ai-disclosure/page.tsx',
  'app/ai-disclosure/memo/page.tsx',
  'app/components/AiDisclosureLabel.tsx',
]

async function renderStandard() {
  const mod = (await import('../app/ai-disclosure/page')) as { default: () => ReactElement }
  const html = renderToStaticMarkup(createElement(mod.default))
  return { html, text: flat(html) }
}

async function renderMemo(slug?: string) {
  const mod = (await import('../app/ai-disclosure/memo/page')) as { default: (p: { searchParams: Promise<{ slug?: string }> }) => Promise<ReactElement> }
  const html = renderToStaticMarkup(await mod.default({ searchParams: Promise.resolve(slug ? { slug } : {}) }))
  return { html, text: flat(html) }
}

describe('/ai-disclosure', () => {
  it('has one H1 and the planned sections', async () => {
    const { html, text } = await renderStandard()
    expect(html.match(/<h1/g)).toHaveLength(1)
    for (const h of ['Why this exists', 'The 15 questions', 'What each duty asks of you', 'What a label looks like', 'Free diligence memo', 'How a vendor publishes one (free)', 'Reviewed AI Disclosure', 'What this is not', 'Sources', 'Questions']) expect(text, h).toContain(h)
  })
  it('links every source and says when it was read', async () => {
    const { html, text } = await renderStandard()
    expect(DISCLOSURE_SOURCES).toHaveLength(6)
    for (const s of DISCLOSURE_SOURCES) expect(html).toContain(`href="${s.url.replace(/&/g, '&amp;')}"`)
    expect(text).toContain('Read on 2026-11-27')
    expect(text).toContain('July 29, 2024')
    expect(text).toContain('1,400 questions')
  })
  it('shows only the fictional vendor, marked as such', async () => {
    const { text } = await renderStandard()
    expect(text).toContain('Example Vendor, Inc. is made up')
    expect(text).toContain('Fictional example')
  })
  it('says it is not legal advice and the site is not a law firm', async () => {
    const { text } = await renderStandard()
    expect(text).toContain('LegalAIMCP is not a law firm and this is not legal advice')
    expect(text).toContain("Check your own state's rules")
  })
  it('prices the Reviewed tier at $1,200 a year with an email button, never the Featured checkout', async () => {
    const { html, text } = await renderStandard()
    expect(text).toContain('$1,200')
    expect(text).toContain('every 90 days')
    expect(text).toContain('thousands of dollars a year')
    expect(html).toContain('href="mailto:hello@legalaimcp.com?subject=Reviewed%20AI%20Disclosure"')
    expect(html).not.toContain('/api/stripe/checkout')
    expect(text).toContain('We never change an answer for pay')
  })
})

describe('/ai-disclosure/memo', () => {
  it('defaults to the example and lists each answer, source, duty and the open questions', async () => {
    const { html, text } = await renderMemo()
    expect(html.match(/<h1/g)).toHaveLength(1)
    expect(text).toContain('Example Draft Assistant, Example Vendor, Inc.')
    expect(text).toContain('Fictional example. This vendor and its answers are made up.')
    expect(text).toContain('4.2 Use of Customer Data')
    expect(text).toContain('Informed consent for self-learning tools')
    expect(text).toContain('Questions to ask the vendor')
    expect(text).toContain('Can your staff read our inputs or outputs?')
    expect(text).toContain("Not legal advice; check your own state's rules.")
  })
  it('falls back to the example for an unknown or malformed slug', async () => {
    for (const slug of ['no-such-vendor', '<script>', 'constructor']) {
      const { text } = await renderMemo(slug)
      expect(text, slug).toContain('Example Vendor, Inc.')
    }
  })
  it('hides the picker and print button in print and sends nothing anywhere', () => {
    const src = read('app/ai-disclosure/memo/page.tsx')
    expect(src).toContain('className="print:hidden"')
    expect(src).toContain('method="get"')
    expect(src).not.toMatch(/fetch\(|localStorage|sessionStorage|'use client'/)
  })
})

describe('listing label', () => {
  it('says no disclosure is published yet and links the standard when a listing has none', () => {
    const text = flat(renderToStaticMarkup(createElement(AiDisclosureLabel, { disclosure: null })))
    expect(text).toContain('No AI disclosure published yet')
    expect(renderToStaticMarkup(createElement(AiDisclosureLabel, { disclosure: null }))).toContain('href="/ai-disclosure"')
  })
  it('is wired into the listing page from the published registry only', () => {
    const src = read('app/servers/[slug]/page.tsx')
    expect(src).toContain('<AiDisclosureLabel disclosure={getPublishedDisclosure(listing.slug)} />')
  })
  it('marks a reviewed label with its date and the next check', () => {
    const html = renderToStaticMarkup(createElement(AiDisclosureLabel, {
      disclosure: {
        slug: 'fixture', vendor: 'Fixture Co.', product: 'Fixture', status: 'reviewed', publishedAt: '2026-11-01', reviewedAt: '2026-11-27',
        answers: Object.fromEntries(['trains_by_default', 'training_opt_out', 'third_party_models', 'base_models_named', 'retention_period', 'deletion_on_request', 'storage_location', 'encryption', 'security_certification', 'human_review', 'prompt_logging', 'zero_data_retention', 'breach_notice', 'subprocessor_list', 'law_firm_terms'].map((id) => [id, { answer: 'not_disclosed' }])) as never,
      },
    }))
    const text = flat(html)
    expect(text).toContain('Reviewed 2026-11-27')
    expect(text).toContain('check again by 2027-02-25')
  })
})

describe('pricing, footer and sitemap', () => {
  it('pricing shows the Reviewed tier with an email button', () => {
    const src = read('app/pricing/page.tsx')
    expect(src).toContain('Reviewed AI Disclosure')
    expect(src).toContain('href={REVIEWED_MAILTO}')
  })
  it('footer and sitemap list the standard', () => {
    expect(read('app/components/Footer.tsx')).toContain("href: '/ai-disclosure'")
    const sitemap = read('app/sitemap.ts')
    expect(sitemap).toContain('`${SITE_URL}/ai-disclosure`')
    expect(sitemap).toContain('`${SITE_URL}/ai-disclosure/memo`')
  })
})

describe('copy rules', () => {
  it('uses no em or en dashes and no stock AI phrases in the new files', () => {
    for (const f of FILES) {
      const src = read(f)
      expect(src, `${f} dash`).not.toMatch(/[–—]/)
      expect(src, `${f} phrase`).not.toMatch(/\b(unlock|seamless|leverage|empower)\w*|in today's/i)
    }
  })
})
