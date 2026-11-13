// Claude Sonnet 5.5, 2026-11-12: one place that keeps every <title> and meta description inside
// the ranges Ahrefs and Google check (title <= 60 chars, description 110-160 chars).
// Ahrefs 11/12 flagged 15 titles too long and 50 descriptions too short; the cause was page
// metadata built from raw data (tagline, headline) with no length check.
const BRAND = ' | LegalAIMCP' // appended by the root layout title template
export const TITLE_MAX = 60
export const DESC_MIN = 110
export const DESC_MAX = 160

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
