// Claude Sonnet 5.5, 2026-11-12: one place that keeps every <title> and meta description inside
// the ranges Ahrefs and Google check (title <= 60 chars, description 110-160 chars).
// Ahrefs 11/12 flagged 15 titles too long and 50 descriptions too short; the cause was page
// metadata built from raw data (tagline, headline) with no length check.
import type { Metadata } from 'next'

const BRAND = ' | LegalAIMCP' // appended by the root layout title template
export const TITLE_MAX = 60
export const DESC_MIN = 110
// Claude Sonnet 5.5, 2026-11-16: director asked for descriptions of 155 or fewer (was 160); Ahrefs flags 160+.
export const DESC_MAX = 155

function cut(text: string, max: number): string {
  if (text.length <= max) return text
  const head = text.slice(0, max - 1)
  const space = head.lastIndexOf(' ')
  return `${head.slice(0, space > 20 ? space : head.length).replace(/[\s,;:.\-–—]+$/, '')}…`
}

/** Title for Next metadata: keeps the brand suffix when it fits, drops it when it does not. */
export function fitTitle(base: string): string | { absolute: string } {
  if (base.length + BRAND.length <= TITLE_MAX) return base
  return { absolute: cut(base, TITLE_MAX) }
}

/**
 * Description of 110-160 chars. A short one gets a sentence appended that is true of every page
 * that uses it (`filler`, then a shorter `fallback`); one that cannot be extended without passing
 * 160 stays as written; a long one is cut at a word boundary.
 */
export function fitDescription(desc: string, filler: string, fallback = 'See sources on LegalAIMCP.'): string {
  const base = desc.trim()
  if (base.length >= DESC_MIN) return cut(base, DESC_MAX)
  const stem = /[.!?]$/.test(base) ? base : `${base}.`
  for (const add of [filler, fallback]) {
    const out = `${stem} ${add}`
    if (out.length <= DESC_MAX) return out
  }
  return base
}

export const FILLER = {
  listing: 'See pricing, access notes and source links on LegalAIMCP.',
  category: 'Compare the listed tools, pricing and source links in the LegalAIMCP directory.',
  post: 'Read the full article on the LegalAIMCP blog.',
  guide: 'Read the full reviewed guide on LegalAIMCP.',
  best: 'See each tool with pricing and source links on LegalAIMCP.',
} as const

/**
 * Claude Sonnet 5.5, 2026-11-16: a page that sets its own `openGraph` replaces the layout's whole block,
 * so it lost og:url and og:image (Ahrefs: "Open Graph URL not matching canonical" 21, "OG tags incomplete" 57),
 * and a page with none inherited the home page's og:url. This fills og:url from the page's own canonical and
 * adds the shared card image, so the social tags always agree with the canonical. Pages with no canonical
 * (not-found fallbacks) are returned unchanged.
 */
export function withSocial(meta: Metadata): Metadata {
  const canonical = meta.alternates?.canonical
  if (typeof canonical !== 'string') return meta
  const t = meta.title
  const title = typeof t === 'string' ? t : t && typeof t === 'object' && 'absolute' in t && t.absolute ? t.absolute : undefined
  const og = (meta.openGraph ?? {}) as NonNullable<Metadata['openGraph']>
  const merged = {
    type: 'website',
    siteName: 'LegalAIMCP',
    locale: 'en_US',
    title,
    description: typeof meta.description === 'string' ? meta.description : undefined,
    ...og,
    url: canonical,
    images: og.images ?? [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'LegalAIMCP: AI integrations for law firms' }],
  } as NonNullable<Metadata['openGraph']>
  return { ...meta, openGraph: merged }
}
