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
