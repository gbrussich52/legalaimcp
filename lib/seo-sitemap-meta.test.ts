// Claude Sonnet 5.5, 2026-11-16: Ahrefs flagged long titles and descriptions and og:url values that differ from the
// canonical. This renders the title and description of every route in app/sitemap.ts (static pages, plus the
// /best, /blog and /servers templates) and fails when a rendered title passes 60 characters, a description passes
// 155, or og:url is not the page's own canonical. /categories/[slug] and the per-listing taglines come from the database,
// so they are covered by the fitTitle / fitDescription tests in seo-meta.test.ts rather than here.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Metadata } from 'next'
import { CATEGORY_CONTENT } from './category-content'
import { getAllPosts } from './blog'
import { serverPageTitle } from './server-title'
import { fitDescription, fitTitle, FILLER, withSocial } from './seo-meta'

const SUFFIX = ' | LegalAIMCP' // root layout title template
const rendered = (t: Metadata['title']) => (typeof t === 'string' ? `${t}${SUFFIX}` : (t as { absolute: string }).absolute)

const STATIC = ['pilot', 'document-check', 'workflow-plan', 'workflow-assessment', 'pricing', 'privacy', 'terms', 'servers', 'mcp', 'submit', 'about', 'blog', 'best/legal-mcp-servers', 'guides/connect-claude-to-courtlistener', 'guides/connect-claude-to-harvey', 'guides/connect-claude-to-clio']

async function check(name: string, meta: Metadata, path: string) {
  const title = rendered(meta.title)
  expect(title.length, `${name} title (${title.length}): ${title}`).toBeLessThanOrEqual(60)
  expect((meta.description as string).length, `${name} description`).toBeLessThanOrEqual(155)
  expect((meta.description as string).length, `${name} description`).toBeGreaterThanOrEqual(110)
  const social = withSocial(meta)
  expect(social.openGraph?.url, name).toBe(`https://legalaimcp.com${path}`)
  expect(meta.alternates?.canonical, name).toBe(`https://legalaimcp.com${path}`)
  expect(social.openGraph?.images, name).toBeTruthy()
}

describe('sitemap routes: rendered title, description, canonical and og:url', () => {
  for (const route of STATIC) {
    it(`/${route}`, async () => {
      const mod = (await import(/* @vite-ignore */ `../app/${route}/page.tsx`)) as { metadata: Metadata }
      await check(route, mod.metadata, `/${route}`)
    })
  }
  it('/about description is 150 or fewer', async () => {
    const { metadata } = (await import(/* @vite-ignore */ `../app/${'about'}/page.tsx`)) as { metadata: Metadata }
    expect((metadata.description as string).length).toBeLessThanOrEqual(150)
  })
  it('/ (home)', async () => {
    const { metadata } = (await import('../app/page')) as { metadata: Metadata }
    expect(rendered(metadata.title).length).toBeLessThanOrEqual(60)
    expect((metadata.description as string).length).toBeLessThanOrEqual(155)
    expect(metadata.openGraph?.url).toBe('https://legalaimcp.com')
  })
  it('/best/{category}-mcp-servers', async () => {
    const { generateMetadata } = await import('../app/best/[slug]/page')
    for (const slug of Object.keys(CATEGORY_CONTENT)) {
      const path = `/best/${slug}-mcp-servers`
      await check(path, await generateMetadata({ params: Promise.resolve({ slug: `${slug}-mcp-servers` }) }), path)
    }
  })
  it('/blog/{post}', async () => {
    const { generateMetadata } = await import('../app/blog/[slug]/page')
    for (const post of getAllPosts()) {
      const path = `/blog/${post.slug}`
      await check(path, await generateMetadata({ params: Promise.resolve({ slug: post.slug }) }), path)
    }
  })
  it('/servers/{reviewed listing}: title and description builders', () => {
    const reviews = JSON.parse(readFileSync(new URL('./catalog-reviews.json', import.meta.url), 'utf8')).reviews as { slug: string; claims: { name: string; tagline: string } }[]
    for (const r of reviews) {
      const title = rendered(fitTitle(serverPageTitle(r.claims.name)))
      expect(title.length, `${r.slug}: ${title}`).toBeLessThanOrEqual(60)
      const d = fitDescription(r.claims.tagline, FILLER.listing)
      expect(d.length, r.slug).toBeLessThanOrEqual(155)
    }
  })
})
