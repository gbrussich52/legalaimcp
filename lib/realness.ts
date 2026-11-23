// Claude Sonnet 5.5, 2026-11-23: pure logic for the "is this vendor real" check (no network, no I/O).
// Why: the catalog gate proves what a vendor's pages SAY. It never asked whether the vendor exists. These
// checks record what was observed on a date (domain age, mail records, a live MCP handshake, the official
// registry) and judge() turns them into pass / watch / fail. Probes live in scripts/realness.mjs; the data is
// untrusted text and is only parsed here, never evaluated. A pass shows what was observed, nothing more.
import { getDomain } from 'tldts'

export type CheckResult = 'pass' | 'warn' | 'fail' | 'unknown' | 'not_applicable'
export type Level = 'pass' | 'watch' | 'fail'
export type Check = {
  id: string
  result: CheckResult
  /** Plain words, one line. Shown to the public when `public` is true. */
  observed: string
  /** A literal command or URL a stranger can run. */
  how_to_repeat: string
  /** False means internal alert only; never shown on the listing. */
  public: boolean
  /** Machine value for judge(): the registration date (YYYY-MM-DD) on the domain_age check. */
  value?: string
}
export type RealnessRecord = { slug: string; checked_at: string; level: Level; reasons: string[]; checks: Check[] }

const DAY = 86_400_000
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

/** Host or URL to registrable domain (eTLD+1), correct for co.jp, com.ua, co.uk. Null for junk and IP addresses. */
export function registrableDomain(input: string): string | null {
  const text = String(input ?? '').trim()
  if (!text) return null
  let host = text
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) {
    try { host = new URL(text).hostname } catch { return null }
  }
  return getDomain(host.toLowerCase()) || null
}

/** RDAP JSON to the registration date (YYYY-MM-DD). Null when absent, unreadable or in the future. */
export function parseRdapRegistration(json: unknown, today?: string | Date): string | null {
  const events = (json as { events?: unknown } | null)?.events
  if (!Array.isArray(events)) return null
  const event = events.find((e) => e && typeof e === 'object' && (e as { eventAction?: unknown }).eventAction === 'registration') as { eventDate?: unknown } | undefined
  const stamp = Date.parse(String(event?.eventDate ?? ''))
  if (!Number.isFinite(stamp)) return null
  const day = new Date(stamp).toISOString().slice(0, 10)
  if (today !== undefined && Date.parse(`${day}T00:00:00Z`) > toDay(today)) return null
  return day
}

/**
 * Official MCP registry answer to a match. A match is an entry whose remotes[].url host equals the listing's
 * endpoint host, or whose reverse-domain namespace equals the listing's registrable domain.
 * The registry shows control of a namespace, not quality.
 */
export function parseRegistryMatch(json: unknown, { endpointHost, domain }: { endpointHost: string | null; domain: string | null }): { namespace: string; since: string } | null {
  const servers = (json as { servers?: unknown } | null)?.servers
  if (!Array.isArray(servers)) return null
  const wantHost = endpointHost?.toLowerCase() ?? null
  const wantNs = domain ? domain.toLowerCase().split('.').reverse().join('.') : null
  for (const entry of servers) {
    const server = ((entry as { server?: unknown })?.server ?? entry) as { name?: unknown; remotes?: unknown } | null
    const name = typeof server?.name === 'string' ? server.name : ''
    if (!name) continue
    const namespace = name.split('/')[0].toLowerCase()
    const hostHit = wantHost !== null && Array.isArray(server?.remotes) && server.remotes.some((r) => {
      try { return new URL(String((r as { url?: unknown })?.url)).hostname.toLowerCase() === wantHost } catch { return false }
    })
    if (!hostHit && !(wantNs !== null && namespace === wantNs)) continue
    const meta = (entry as { _meta?: Record<string, { publishedAt?: unknown }> })?._meta?.['io.modelcontextprotocol.registry/official']
    const stamp = Date.parse(String(meta?.publishedAt ?? ''))
    return { namespace: name, since: Number.isFinite(stamp) ? new Date(stamp).toISOString().slice(0, 10) : '' }
  }
  return null
}

function jsonRpcMessages(body: string): unknown[] {
  const text = String(body ?? '').trim()
  if (!text) return []
  const raws = text.startsWith('{') ? [text] : text.split(/\r?\n/).filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim())
  const out: unknown[] = []
  for (const raw of raws) { try { out.push(JSON.parse(raw)) } catch { /* not JSON: ignore, it is data */ } }
  return out
}
const named = (info: { name?: unknown; version?: unknown } | undefined) =>
  info && typeof info.name === 'string' && info.name.trim()
    ? { serverName: oneLine(info.name, 80), version: typeof info.version === 'string' ? oneLine(info.version, 40) : '' }
    : null

/** An initialize answer, as plain JSON or an SSE `data:` body, to the server's own name and version. */
export function parseHandshakeBody(body: string): { serverName: string; version: string } | null {
  for (const value of jsonRpcMessages(body)) {
    const found = named((value as { result?: { serverInfo?: { name?: unknown; version?: unknown } } } | null)?.result?.serverInfo)
    if (found) return found
  }
  return null
}

/** A `server/discover` answer (draft spec 2026-07-28): identity sits in result._meta["io.modelcontextprotocol/serverInfo"]. */
export function parseDiscoverBody(body: string): { serverName: string; version: string } | null {
  for (const value of jsonRpcMessages(body)) {
    const found = named((value as { result?: { _meta?: Record<string, { name?: unknown; version?: unknown }> } } | null)?.result?._meta?.['io.modelcontextprotocol/serverInfo'])
    if (found) return found
  }
  return null
}

/** True when the body carries a JSON-RPC error object. A modern server answers an unknown method with 404 plus one. */
export function isJsonRpcError(body: string): boolean {
  return jsonRpcMessages(body).some((v) => Boolean(v) && typeof v === 'object' && typeof (v as { error?: { code?: unknown } }).error?.code === 'number')
}

/** HTTP 401 or 403 with a WWW-Authenticate header: the endpoint is there and asks for sign-in. */
export function parseAuthChallenge(status: number, wwwAuthenticate: string | null | undefined): boolean {
  return (status === 401 || status === 403) && Boolean(wwwAuthenticate && wwwAuthenticate.trim())
}

function oneLine(text: string, max: number) { return text.replace(/\s+/g, ' ').trim().slice(0, max) }
function toDay(today: string | Date): number {
  const iso = typeof today === 'string' ? today.slice(0, 10) : today.toISOString().slice(0, 10)
  return Date.parse(`${iso}T00:00:00Z`)
}

/**
 * Level from the checks. fail: site unreachable, domain under 30 days, security resolver blocks it, listed MCP
 * endpoint gone. watch: domain under 180 days, unknown registration date, no mail records, handshake not checked.
 * A site that blocks automated readers is `unknown`, never `fail`; registry absence is never worse than `unknown`.
 */
export function judge(checks: Check[], today: string | Date): { level: Level; reasons: string[] } {
  const now = toDay(today)
  const get = (id: string) => checks.find((c) => c.id === id)
  const failReasons: string[] = [], watchReasons: string[] = []

  if (get('site')?.result === 'fail') failReasons.push('the site could not be reached')
  if (get('security_resolver')?.result === 'fail') failReasons.push('a security DNS resolver blocks the domain')
  if (get('mcp_endpoint')?.result === 'fail') failReasons.push('the listed MCP endpoint is gone')

  const age = get('domain_age')
  if (age && age.result !== 'not_applicable') {
    const registered = age.value && ISO_DAY.test(age.value) ? Date.parse(`${age.value}T00:00:00Z`) : NaN
    if (!Number.isFinite(registered)) watchReasons.push('the domain registration date is unknown')
    else {
      const days = Math.floor((now - registered) / DAY)
      if (days < 30) failReasons.push(`the domain was registered ${Math.max(days, 0)} days ago`)
      else if (days < 180) watchReasons.push(`the domain is under 180 days old (${days} days)`)
    }
  }
  if (get('mail')?.result === 'warn') watchReasons.push('the domain has no mail records')
  if (get('mcp_endpoint')?.result === 'unknown') watchReasons.push('the MCP handshake could not be checked')

  const level: Level = failReasons.length ? 'fail' : watchReasons.length ? 'watch' : 'pass'
  return { level, reasons: [...failReasons, ...watchReasons] }
}
