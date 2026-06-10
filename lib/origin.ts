/**
 * Same-origin request verification for CSRF defense (Wave 2).
 *
 * Applied to every mutating admin surface: the login route handler, the
 * logout route handler, and all admin server actions (via requireAdmin).
 *
 * Strategy — header-based, no tokens, no new dependencies:
 *   1. Sec-Fetch-Site (sent by all modern browsers, cannot be set by JS):
 *      reject anything other than 'same-origin' or 'none' (direct navigation).
 *   2. Origin vs Host (X-Forwarded-Host on Vercel): if an Origin header is
 *      present, its host must exactly match the request's host.
 *   3. If neither header is present (curl, server-to-server), allow: CSRF
 *      requires a browser to attach ambient cookies, and browsers always send
 *      these headers on cross-site POSTs. Auth is still enforced separately.
 *
 * Note: Next.js 15 already performs an Origin/Host check for Server Actions;
 * this makes the same guarantee explicit, testable, and consistent across the
 * route handlers (which Next does NOT cover).
 */

/** Minimal header accessor — satisfied by both Headers and Next's ReadonlyHeaders. */
type HeaderReader = Pick<Headers, 'get'>

export function isSameOriginRequest(headers: HeaderReader): boolean {
  // 1. Sec-Fetch-Site: 'cross-site' and 'same-site' (subdomain) are both rejected.
  const secFetchSite = headers.get('sec-fetch-site')
  if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'none') {
    return false
  }

  // 2. Origin/Host comparison.
  const origin = headers.get('origin')
  if (origin) {
    // Vercel terminates TLS at the proxy — the original host arrives in
    // x-forwarded-host. Take the first value if the proxy chain appended more.
    const host = (headers.get('x-forwarded-host') ?? headers.get('host'))?.split(',')[0].trim()
    if (!host) return false
    try {
      if (new URL(origin).host !== host) return false
    } catch {
      // Unparseable Origin header — treat as hostile.
      return false
    }
  }

  return true
}
