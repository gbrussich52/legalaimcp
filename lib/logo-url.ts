/**
 * Logo URL sanitization (audit S4).
 *
 * listing.logo_url is stored as free TEXT in the DB and rendered directly into
 * <img src>. Without validation, a malicious value (javascript:, data:, or an
 * attacker-controlled http: tracking pixel) could reach the browser via an
 * approved listing or a direct DB write.
 *
 * Strategy: strict URL parsing + protocol enforcement, applied server-side at
 * every render site (all consumers are Server Components):
 *   - must parse as an absolute URL
 *   - protocol must be https: (blocks javascript:, data:, http:, file:, etc.)
 *   - no embedded credentials (https://user:pass@host trickery)
 *   - hostname must contain a dot (blocks localhost / single-label hosts)
 *
 * A hostname allowlist was considered (audit recommendation) but rejected for
 * now: 54 live listings carry logos from arbitrary vendor CDNs that cannot be
 * enumerated without a production DB audit. If that audit happens (Wave 3),
 * tighten this by checking url.hostname against an ALLOWED_LOGO_HOSTS set.
 */
export function sanitizeLogoUrl(raw: string | null | undefined): string | null {
  if (!raw) return null

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }

  if (url.protocol !== 'https:') return null
  if (url.username || url.password) return null
  if (!url.hostname.includes('.')) return null

  return url.href
}
