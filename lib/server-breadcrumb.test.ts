// Grok Bot (Crack Bot), 2026-11-09, why: tool pages must keep BreadcrumbList markup that matches the visible breadcrumb.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const src = readFileSync(resolve(__dirname, '..', 'app/servers/[slug]/page.tsx'), 'utf8')

describe('/servers/[slug] breadcrumb', () => {
  it('emits BreadcrumbList for Home > Browse Tools > tool', () => {
    expect(src).toContain('<BreadcrumbJsonLd')
    expect(src).toContain("{ name: 'Home', path: '/' }")
    expect(src).toContain("{ name: 'Browse Tools', path: '/servers' }")
    expect(src).toContain('path: `/servers/${listing.slug}`')
  })
  it('shows the same three crumbs in the page', () => {
    expect(src).toMatch(/aria-label="Breadcrumb"/)
    expect(src).toMatch(/href="\/"[\s\S]*?Home[\s\S]*?href="\/servers"[\s\S]*?Browse Tools/)
  })
})
