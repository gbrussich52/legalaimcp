// Claude Opus, 2026-11-12: keep /servers/[slug] titles near Google's ~60 char
// display limit. The old "<name> — AI Tool for Law Firms | LegalAIMCP" ran to
// 71-86 chars on 13 long community-server names and got cut mid-word.
const SUFFIX = ' — AI Tool for Law Firms'
const BRAND = ' | LegalAIMCP' // appended by the root layout title template
export const SERVER_TITLE_MAX = 65

export function serverPageTitle(name: string): string {
  return name.length + SUFFIX.length + BRAND.length <= SERVER_TITLE_MAX ? `${name}${SUFFIX}` : name
}
