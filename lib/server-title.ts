// Claude Opus, 2026-11-12: keep /servers/[slug] titles near Google's ~60 char
// display limit. The old "<name> — AI Tool for Law Firms | LegalAIMCP" ran to
// 71-86 chars on 13 long community-server names and got cut mid-word.
// Claude, 2026-11-26: Ahrefs 11/26 still flagged 15 titles as too long. Every rendered title was already 60 or fewer
// characters, but the template allowed up to 65 before fitTitle dropped the brand, so many sat at 58 to 60 and lost
// "| LegalAIMCP". The budget is now 55, with a shorter suffix tried before none, so most titles keep the brand at the end
// with room to spare under a pixel-width check.
const SUFFIX = ' — AI Tool for Law Firms'
const SHORT_SUFFIX = ' — Legal AI Tool'
const BRAND = ' | LegalAIMCP' // appended by the root layout title template
export const SERVER_TITLE_MAX = 55

export function serverPageTitle(name: string): string {
  for (const suffix of [SUFFIX, SHORT_SUFFIX]) {
    if (name.length + suffix.length + BRAND.length <= SERVER_TITLE_MAX) return `${name}${suffix}`
  }
  return name
}
