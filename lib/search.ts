/**
 * Search query sanitization for PostgREST .or() filter construction.
 *
 * PostgREST's ilike filter operator uses % as wildcard and ( ) , as structural
 * delimiters in the .or() syntax. An unsanitized query string can break out of
 * the ilike value and inject additional filter conditions — potentially exposing
 * non-published listings. Stripping those chars and capping length closes the
 * injection vector.
 *
 * Characters removed: ( ) , %
 * Length cap: 100 chars (enough for any reasonable search; prevents
 * excessively long DB filter strings).
 */
export function sanitizeSearchQuery(q: string): string {
  return q.slice(0, 100).replace(/[(),%]/g, '')
}

// Claude Opus, 2026-11-12: relevance ranking for the MCP search tool.
// The tool used to apply `.limit()` in the database after ordering only by
// verified, then featured. Any row with one token anywhere in its description
// matched, and the cut kept whichever matches happened to be verified first.
// Live proof: "contract review" returned CourtListener, CoCounsel, NYClaw,
// Harvey and Smith.ai ahead of Concord and Kira, the actual contract tools.
// The catalog is small (about 50 rows), so we fetch every match and rank here.
// Paid or editorial Featured only breaks ties; it never beats a better match.

export const SEARCH_STOPWORDS = new Set([
  'the', 'a', 'an', 'for', 'and', 'or', 'of', 'to', 'in', 'on',
  'with', 'my', 'me', 'i', 'ai', 'tool', 'tools', 'legal', 'law',
  'best', 'good', 'need', 'want', 'that', 'this', 'is', 'are',
  // Who is asking, not what the tool does. "law-firm" appears in many
  // taglines, so these words ranked generic tools above the real match.
  'firm', 'firms', 'small', 'solo', 'large', 'lawyer', 'lawyers',
  'attorney', 'attorneys', 'our', 'can', 'what', 'which', 'help',
])

/** Lowercase tokens, metacharacters stripped, stopwords dropped, max 4. */
export function searchTerms(query: string): string[] {
  const clean = query.replace(/[,()*\\%]/g, ' ').toLowerCase()
  const tokens = clean
    .split(/\s+/)
    .filter((t) => t.length > 2 && !SEARCH_STOPWORDS.has(t))
    .slice(0, 4)
  // An all-stopword query falls back to the raw string rather than matching everything.
  if (tokens.length) return tokens
  const raw = clean.trim()
  return raw ? [raw] : []
}

export interface SearchableRow {
  name?: unknown
  tagline?: unknown
  description?: unknown
  category_label?: unknown
  verified?: unknown
  verified_at?: unknown
  featured?: unknown
}

const text = (v: unknown) => (typeof v === 'string' ? v.toLowerCase() : '')

/** Higher is a better match. Zero means no term appears in any field. */
export function searchScore(row: SearchableRow, terms: string[]): number {
  const name = text(row.name)
  const tagline = text(row.tagline)
  // Nearly every description ends with a "Documentation reviewed ..." note,
  // so a "review" query hit them all. Score the description without it.
  const description = text(row.description).replace(/documentation reviewed[^.]*\./g, ' ')
  const label = text(row.category_label)
  let score = 0
  let hit = 0
  for (const t of terms) {
    const s =
      (name.includes(t) ? 5 : 0) +
      (tagline.includes(t) ? 3 : 0) +
      (label.includes(t) ? 2 : 0) +
      (description.includes(t) ? 1 : 0)
    if (s > 0) hit++
    score += s
  }
  // Rows that match every term beat rows that match one term many times.
  if (terms.length > 1 && hit === terms.length) score += 4
  return score
}

/** Rank matches by relevance, then link-verified, then featured, then name. */
export function rankSearchResults<T extends SearchableRow>(rows: T[], terms: string[], limit: number): T[] {
  return rows
    .map((row) => ({ row, score: searchScore(row, terms) }))
    .filter((r) => r.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(Boolean(b.row.verified && b.row.verified_at)) - Number(Boolean(a.row.verified && a.row.verified_at)) ||
        Number(Boolean(b.row.featured)) - Number(Boolean(a.row.featured)) ||
        text(a.row.name).localeCompare(text(b.row.name))
    )
    .slice(0, limit)
    .map((r) => r.row)
}
