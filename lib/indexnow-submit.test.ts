// Claude, 2026-11-26: pins the URL list the post-build IndexNow submit sends, and the production-only, never-fail wiring.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { urlsFromSitemap } from '../scripts/seo/indexnow-submit.mjs'

const root = resolve(__dirname, '..')

describe('urlsFromSitemap', () => {
  it('keeps this host only, decodes &amp; and drops duplicates', () => {
    const xml = `<urlset>
      <url><loc>https://legalaimcp.com</loc></url>
      <url><loc> https://legalaimcp.com/servers/clio </loc></url>
      <url><loc>https://legalaimcp.com/servers/clio</loc></url>
      <url><loc>https://legalaimcp.com/servers?a=1&amp;b=2</loc></url>
      <url><loc>https://example.com/other</loc></url>
    </urlset>`
    expect(urlsFromSitemap(xml)).toEqual([
      'https://legalaimcp.com',
      'https://legalaimcp.com/servers/clio',
      'https://legalaimcp.com/servers?a=1&b=2',
    ])
  })
  it('caps the list at 10,000', () => {
    const xml = Array.from({ length: 10050 }, (_, i) => `<loc>https://legalaimcp.com/p/${i}</loc>`).join('')
    expect(urlsFromSitemap(xml)).toHaveLength(10000)
  })
})

describe('wiring', () => {
  const script = readFileSync(resolve(root, 'scripts/seo/indexnow-submit.mjs'), 'utf8')
  it('runs on production builds only and always exits 0', () => {
    expect(script).toContain("process.env.VERCEL_ENV !== 'production'")
    expect(script).toContain('.finally(() => process.exit(0))')
  })
  it('uses the published key file', () => {
    const key = readFileSync(resolve(root, 'public/1a366e5be29e8a3030dd846be8b6acfa.txt'), 'utf8').trim()
    expect(script).toContain(`const KEY = '${key}'`)
  })
  it('runs after the catalog check in postbuild', () => {
    const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
    expect(pkg.scripts.postbuild).toBe('node scripts/check-catalog-artifacts.mjs && node scripts/seo/indexnow-submit.mjs')
  })
})
