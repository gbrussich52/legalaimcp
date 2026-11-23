// PUBLIC. Claude Sonnet 5.5, 2026-11-23: network probes for the "is this vendor real" check.
// Why: the catalog gate proves what a vendor's pages SAY. This asks whether the vendor exists at all: does the
// site answer, how old is the domain, does it take mail, does a listed MCP endpoint answer an initialize call,
// is it in the official MCP registry. Logic that needs no network lives in lib/realness.ts (tested).
// Safety: https only; hosts that resolve to private, loopback or link-local addresses are refused; generic
// User-Agent; 15 s timeout, 2 MB cap, 5 redirects; at most 4 listings at once. Everything fetched is data and
// is parsed, never evaluated. The only MCP methods sent are initialize and server/discover. No tools/call, ever.
//
// Usage:
//   node scripts/realness.mjs --all [--write] [--check] [--report]
//   node scripts/realness.mjs --slug SLUG [--slug SLUG2 ...] [--write] [--report]
//   node scripts/realness.mjs --plan PLAN.json [--report]        admit items of an admission plan; never writes
//   node scripts/realness.mjs --endpoint URL                     one handshake against any MCP URL; never writes
// Exit 1 if any record is fail, 2 on an internal error, else 0.
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { compileFunction } from 'node:vm'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const ROOT = resolve(import.meta.dirname, '..')
const REVIEWS = resolve(ROOT, 'lib/catalog-reviews.json')
const OUT = resolve(ROOT, 'lib/catalog-realness.json')
const CACHE_FILE = resolve(ROOT, '.cache/realness/cache.json') // /.cache/ is git-ignored
const UA = 'listing-review/1.0'
const TIMEOUT_MS = 15_000, CAP_BYTES = 2_000_000, MAX_REDIRECTS = 5, CONCURRENCY = 4
const DAY = 86_400_000
const RDAP_TTL = 30 * DAY, REPO_TTL = 12 * 3_600_000
// .io answers here though the IANA bootstrap file has no entry for it (checked 2026-11-23).
const RDAP_OVERRIDES = { io: 'https://rdap.identitydigital.services/rdap/' }
// The .de registry's terms restrict automated use, so it is never queried.
const RDAP_SKIP = new Set(['de'])
// Code and page hosts: a domain here says nothing about the vendor, so domain-level checks are not applicable.
export const SHARED_DOMAINS = new Set(['github.com', 'gitlab.com', 'bitbucket.org', 'codeberg.org', 'huggingface.co', 'npmjs.com', 'pypi.org', 'github.io', 'gitlab.io'])

// Reuse the tested logic from lib/realness.ts, compiled the same way scripts/import-reviewed-catalog.mjs loads the gate.
export async function loadRealness() {
  const file = resolve(ROOT, 'lib/realness.ts')
  const { outputText } = ts.transpileModule(await readFile(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } })
  const module = { exports: {} }
  compileFunction(outputText, ['require', 'module', 'exports'], { filename: file })(createRequire(file), module, module.exports)
  return module.exports
}

// ---------------------------------------------------------------- safety ----

export class ProbeError extends Error { constructor(kind, message) { super(message); this.kind = kind } }

export function isPrivateAddress(ip) {
  const kind = isIP(ip)
  if (kind === 4) {
    const [a, b] = ip.split('.').map(Number)
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224
  }
  if (kind === 6) {
    const v = ip.toLowerCase()
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPrivateAddress(mapped[1])
    return v === '::' || v === '::1' || /^f[cd]/.test(v) || /^fe[89ab]/.test(v) || v.startsWith('ff')
  }
  return true // not an address at all: treat as unsafe
}

// ------------------------------------------------------------------- DNS ----

const dohCache = new Map()
/** DNS over HTTPS (JSON). `security` uses Cloudflare's malware-blocking resolver. Returns { status, answers }. */
export async function doh(name, type, { provider = 'cloudflare', security = false } = {}) {
  const key = `${provider}|${security}|${type}|${name}`
  if (!dohCache.has(key)) {
    dohCache.set(key, (async () => {
      const base = provider === 'google' ? 'https://dns.google/resolve' : security ? 'https://security.cloudflare-dns.com/dns-query' : 'https://cloudflare-dns.com/dns-query'
      const res = await fetch(`${base}?name=${encodeURIComponent(name)}&type=${type}`, { headers: { accept: 'application/dns-json', 'user-agent': UA }, signal: AbortSignal.timeout(10_000) })
      if (!res.ok) throw new ProbeError('other', `DNS over HTTPS answered HTTP ${res.status}`)
      const json = await res.json()
      return { status: Number(json.Status), answers: Array.isArray(json.Answer) ? json.Answer.map((a) => ({ type: a.type, data: String(a.data) })) : [] }
    })())
  }
  return dohCache.get(key)
}

const publicHostCache = new Map()
/** Refuses literal IPs and any host that resolves to a private, loopback or link-local address. */
export function assertPublicHost(host) {
  const h = host.toLowerCase()
  if (!publicHostCache.has(h)) {
    publicHostCache.set(h, (async () => {
      if (isIP(h) || h.includes(':')) throw new ProbeError('private', 'an IP address is not fetched')
      let addresses = null
      try {
        const [a, aaaa] = await Promise.all([doh(h, 'A'), doh(h, 'AAAA')])
        if (a.status === 3) throw new ProbeError('dns', 'the domain name does not resolve (NXDOMAIN)')
        addresses = [...a.answers, ...aaaa.answers].filter((x) => x.type === 1 || x.type === 28).map((x) => x.data)
      } catch (e) {
        if (e instanceof ProbeError && e.kind === 'dns') throw e
        // DoH itself failed: fall back to the system resolver rather than skip the private-address rule.
        try { addresses = (await lookup(h, { all: true })).map((x) => x.address) } catch { throw new ProbeError('other', 'the name could not be resolved to check it is public') }
      }
      if (addresses.some(isPrivateAddress)) throw new ProbeError('private', 'the name resolves to a private address, so it was not fetched')
    })())
  }
  return publicHostCache.get(h)
}

function classifyError(e) {
  if (e instanceof ProbeError) return e
  const code = e?.cause?.code ?? e?.code
  if (e?.name === 'TimeoutError' || e?.name === 'AbortError') return new ProbeError('timeout', 'no answer within 15 seconds')
  if (code === 'ECONNREFUSED') return new ProbeError('refused', 'connection refused')
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') return new ProbeError('resolve', 'the name could not be resolved from this machine')
  if (/CERT|TLS|SSL/i.test(String(code))) return new ProbeError('tls', 'the TLS certificate was not accepted')
  return new ProbeError('other', `request failed (${String(code ?? e?.message ?? 'unknown').slice(0, 60)})`)
}

async function readCapped(res, cap, stop) {
  const reader = res.body?.getReader()
  if (!reader) return ''
  const chunks = []; let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      chunks.push(value)
      if (size >= cap) break
      if (stop && stop(Buffer.concat(chunks).toString('utf8'))) break
    }
  } finally { await reader.cancel().catch(() => {}) }
  return Buffer.concat(chunks).toString('utf8').slice(0, cap)
}

/** One bounded https request. GET follows up to 5 redirects (https only); POST never follows one. */
export async function safeFetch(rawUrl, { method = 'GET', headers = {}, body, cap = CAP_BYTES, stop } = {}) {
  let url = new URL(rawUrl), hops = 0
  for (;;) {
    if (url.protocol !== 'https:') throw new ProbeError('scheme', 'not an https address, so it was not fetched')
    if (url.username || url.password) throw new ProbeError('scheme', 'an address with a login part was not fetched')
    await assertPublicHost(url.hostname)
    let res
    try { res = await fetch(url, { method, headers: { 'user-agent': UA, ...headers }, body, redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS) }) } catch (e) { throw classifyError(e) }
    const location = res.headers.get('location')
    if (method === 'GET' && res.status >= 300 && res.status < 400 && location) {
      await res.body?.cancel().catch(() => {})
      if (++hops > MAX_REDIRECTS) throw new ProbeError('redirects', 'more than 5 redirects')
      try { url = new URL(location, url) } catch { throw new ProbeError('other', 'a redirect pointed at an unreadable address') }
      continue
    }
    let text = ''
    try { text = await readCapped(res, cap, stop) } catch (e) { throw classifyError(e) }
    return { status: res.status, headers: res.headers, text, finalUrl: url, hops }
  }
}

// ----------------------------------------------------------------- cache ----

export async function loadCache() {
  try { const c = JSON.parse(await readFile(CACHE_FILE, 'utf8')); return { rdap: c.rdap ?? {}, repo: c.repo ?? {} } } catch { return { rdap: {}, repo: {} } }
}
export async function saveCache(cache) {
  await mkdir(resolve(CACHE_FILE, '..'), { recursive: true })
  const temp = `${CACHE_FILE}.${process.pid}.tmp`
  await writeFile(temp, JSON.stringify(cache) + '\n'); await rename(temp, CACHE_FILE)
}

export async function createContext({ today = new Date().toISOString().slice(0, 10), useCache = true, lib } = {}) {
  const ctx = { today, lib: lib ?? await loadRealness(), cache: useCache ? await loadCache() : { rdap: {}, repo: {} }, memo: new Map(), ghLimited: false, bootstrap: null }
  return ctx
}
const memo = (ctx, key, fn) => { if (!ctx.memo.has(key)) ctx.memo.set(key, fn()); return ctx.memo.get(key) }

// ---------------------------------------------------------------- checks ----

const mk = (id, result, observed, how_to_repeat, pub = true, value) => ({ id, result, observed, how_to_repeat, public: pub, ...(value ? { value } : {}) })
const hostOfUrl = (u) => { try { return new URL(u).hostname.toLowerCase() } catch { return null } }
const errObserved = (e, what) => `${what}: ${e.message}.`
const daysBetween = (from, today) => Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY)

export async function siteCheck(url, ctx) {
  const how = `curl -sL -o /dev/null -w '%{http_code} %{url_effective}\\n' --max-redirs 5 ${url}`
  const start = ctx.lib.registrableDomain(url)
  try {
    const get = () => safeFetch(url, { headers: { accept: 'text/html,application/xhtml+xml,*/*;q=0.5' } })
    let r = await get()
    // Claude Sonnet 5.5, 2026-11-23: a single 5xx is not "gone". The first full run saw HTTP 500 at alexandria.firecrawl.dev and
    // the next check minutes later saw 200, so a 5xx is asked again after 3 seconds before it counts as a fail.
    if (r.status >= 500) { await new Promise((ok) => setTimeout(ok, 3000)); r = await get() }
    const finalHost = r.finalUrl.hostname, finalDomain = ctx.lib.registrableDomain(r.finalUrl.href)
    if (r.status >= 500) return mk('site', 'fail', `The site answered HTTP ${r.status} at ${finalHost}.`, how)
    if (r.status === 404 || r.status === 410) return mk('site', 'fail', `The listing address answered HTTP ${r.status} (gone) at ${finalHost}.`, how)
    if ([401, 403, 429].includes(r.status)) return mk('site', 'unknown', `The site answered HTTP ${r.status} at ${finalHost}. It blocks automated readers, so nothing was read.`, how)
    if (r.status >= 400) return mk('site', 'unknown', `The site answered HTTP ${r.status} at ${finalHost}.`, how)
    if (start && finalDomain && start !== finalDomain) return mk('site', 'warn', `The listing address redirects to another domain (${finalDomain}); it answered HTTP ${r.status} there.`, how)
    return mk('site', 'pass', `The site answered HTTP ${r.status} at ${finalHost}.`, how)
  } catch (e) {
    const p = classifyError(e)
    if (p.kind === 'refused') return mk('site', 'fail', 'Connection refused: nothing is listening at the listing address.', how)
    if (p.kind === 'dns') return mk('site', 'fail', 'The domain name does not resolve (it does not exist in DNS).', how)
    return mk('site', 'unknown', errObserved(p, 'The site could not be read'), how)
  }
}

async function rdapService(tld, ctx) {
  if (!ctx.bootstrap) {
    ctx.bootstrap = (async () => {
      const r = await safeFetch('https://data.iana.org/rdap/dns.json', { headers: { accept: 'application/json' } })
      const json = JSON.parse(r.text)
      const map = {}
      for (const [tlds, urls] of json.services ?? []) for (const t of tlds) map[String(t).toLowerCase()] = urls.find((u) => u.startsWith('https://')) ?? urls[0]
      return map
    })()
  }
  let map
  try { map = await ctx.bootstrap } catch { return { error: true } }
  const base = map[tld] ?? RDAP_OVERRIDES[tld] ?? null
  return { base: base && base.endsWith('/') ? base : base ? `${base}/` : null }
}

export async function domainAgeCheck(domain, ctx) {
  const how = `curl -sL https://rdap.org/domain/${domain}`
  if (!domain) return mk('domain_age', 'unknown', 'There is no domain to look up.', how)
  if (SHARED_DOMAINS.has(domain)) return mk('domain_age', 'not_applicable', `${domain} is a shared host, so its age says nothing about the vendor.`, how)
  const tld = domain.split('.').pop()
  if (RDAP_SKIP.has(tld)) return mk('domain_age', 'unknown', 'Not checked: registry terms.', how)
  const done = (date) => {
    const days = daysBetween(date, ctx.today)
    const band = days < 30 ? ' That is under 30 days ago.' : days < 180 ? ' That is under 180 days ago.' : ''
    return mk('domain_age', days < 30 ? 'fail' : days < 180 ? 'warn' : 'pass', `The registry (RDAP) shows ${domain} registered on ${date}.${band}`, how, true, date)
  }
  const hit = ctx.cache.rdap[domain]
  if (hit?.date && Date.now() - hit.at < RDAP_TTL) return done(hit.date)
  return memo(ctx, `rdap|${domain}`, async () => {
    const svc = await rdapService(tld, ctx)
    if (svc.error) return mk('domain_age', 'unknown', 'The IANA list of registry servers could not be loaded, so the registration date was not checked.', how)
    if (!svc.base) return mk('domain_age', 'unknown', `No public registry (RDAP) service is listed for .${tld}, so the registration date is unknown.`, how)
    try {
      const r = await safeFetch(`${svc.base}domain/${domain}`, { headers: { accept: 'application/rdap+json, application/json' } })
      if (r.status === 429) return mk('domain_age', 'unknown', 'The registry asked us to slow down (HTTP 429), so the registration date was not read.', how)
      if (r.status !== 200) return mk('domain_age', 'unknown', `The registry (RDAP) answered HTTP ${r.status}, so the registration date is unknown.`, how)
      let json; try { json = JSON.parse(r.text) } catch { json = null }
      const date = ctx.lib.parseRdapRegistration(json, ctx.today)
      if (!date) return mk('domain_age', 'unknown', 'The registry answer carried no readable registration date.', how)
      ctx.cache.rdap[domain] = { date, at: Date.now() }
      return done(date)
    } catch (e) { return mk('domain_age', 'unknown', errObserved(classifyError(e), 'The registry could not be read'), how) }
  })
}

export async function mailCheck(domain, ctx) {
  const how = `curl -s 'https://dns.google/resolve?name=${domain}&type=MX'`
  if (!domain) return mk('mail', 'unknown', 'There is no domain to look up.', how)
  if (SHARED_DOMAINS.has(domain)) return mk('mail', 'not_applicable', `${domain} is a shared host, so its mail records say nothing about the vendor.`, how)
  try {
    const r = await doh(domain, 'MX', { provider: 'google' })
    if (r.status === 3) return mk('mail', 'warn', `${domain} does not exist in DNS, so it has no mail records.`, how)
    const mx = r.answers.filter((a) => a.type === 15 && !/^\d+ \.?$/.test(a.data))
    if (!mx.length) return mk('mail', 'warn', `${domain} has no mail (MX) records.`, how)
    return mk('mail', 'pass', `${domain} has ${mx.length} mail (MX) record${mx.length === 1 ? '' : 's'}.`, how)
  } catch (e) { return mk('mail', 'unknown', errObserved(classifyError(e), 'Mail records could not be read'), how) }
}

const hasAddress = (r) => r.answers.some((a) => (a.type === 1 && a.data !== '0.0.0.0') || (a.type === 28 && a.data !== '::'))
export async function securityResolverCheck(host, ctx) {
  const how = `curl -s -H 'accept: application/dns-json' 'https://cloudflare-dns.com/dns-query?name=${host}&type=A'; curl -s -H 'accept: application/dns-json' 'https://security.cloudflare-dns.com/dns-query?name=${host}&type=A'`
  if (!host) return mk('security_resolver', 'unknown', 'There is no host to look up.', how, false)
  try {
    const [plain, sec] = await Promise.all([doh(host, 'A'), doh(host, 'A', { security: true })])
    if (!hasAddress(plain)) return mk('security_resolver', 'unknown', `${host} did not resolve on the plain resolver either, so there is nothing to compare.`, how, false)
    if (!hasAddress(sec)) return mk('security_resolver', 'fail', `${host} resolves on the plain resolver but the security resolver returns no address (or 0.0.0.0): it blocks the domain.`, how, false)
    return mk('security_resolver', 'pass', `${host} resolves on both the plain and the security resolver.`, how, false)
  } catch (e) { return mk('security_resolver', 'unknown', errObserved(classifyError(e), 'The resolvers could not be read'), how, false) }
}

// ----------------------------------------------------------- MCP endpoint ----

const isSharedUrl = (u) => { const d = SHARED_DOMAINS; const host = hostOfUrl(u); return !host || [...d].some((s) => host === s || host.endsWith(`.${s}`)) }
const ENDPOINT_PATH = /(^|\/)(mcp|sse)\/?$/i
/** A remote MCP address looks like .../mcp or .../sse, or the bare root of an mcp.* host. Repository and docs pages do not. */
export function isEndpointUrl(u) {
  let url; try { url = new URL(u) } catch { return false }
  if (url.protocol !== 'https:' || isSharedUrl(u)) return false
  return ENDPOINT_PATH.test(url.pathname) || (url.hostname.startsWith('mcp.') && (url.pathname === '/' || url.pathname === ''))
}
// Claude Sonnet 5.5, 2026-11-23: a mcp_repo_url that is not on a shared code host is the address the listing
// declares, whatever its path (captainlegal: https://mcp.captain.legal/connect/ answers the handshake). Before,
// only paths ending in /mcp or /sse counted, so the bare host was probed and the record said unknown.
/** Every address the listing may serve MCP on, best first: the declared mcp_repo_url, the install command URL, an mcp.* external_url. */
export function endpointCandidates(listing) {
  const fromCommand = String(listing.mcp_install_command ?? '').match(/https:\/\/[^\s'"]+/)?.[0]
  const declared = (u) => { try { return new URL(u).protocol === 'https:' && !isSharedUrl(u) } catch { return false } }
  const tries = [
    ['mcp_repo_url', declared(listing.mcp_repo_url) ? listing.mcp_repo_url : null],
    ['mcp_install_command', fromCommand && isEndpointUrl(fromCommand) ? fromCommand : null],
    ['external_url', hostOfUrl(listing.external_url)?.startsWith('mcp.') && isEndpointUrl(listing.external_url) ? listing.external_url : null],
  ]
  const seen = new Set(), out = []
  for (const [source, url] of tries) if (url && !seen.has(url)) { seen.add(url); out.push({ url, source }) }
  return out
}
/** The first candidate: where the listing names a remote MCP address. */
export function endpointOf(listing) { return endpointCandidates(listing)[0] ?? null }
/** Probe in order; stop at the first answer that is not unknown. If every candidate is unknown, return the first one's result. */
export async function firstReadable(candidates, probe) {
  let first = null
  for (const c of candidates) {
    const r = await probe(c.url)
    if (r.result !== 'unknown') return r
    first ??= r
  }
  return first
}

const INIT_BODY = { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'listing-review', version: '1.0' } } }
// Draft spec 2026-07-28 (modelcontextprotocol.io/specification/draft/server/discover): per-request _meta, and the
// MCP-Protocol-Version and Mcp-Method headers on every POST.
const DISCOVER_BODY = { jsonrpc: '2.0', id: 'discover-1', method: 'server/discover', params: { _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientInfo': { name: 'listing-review', version: '1.0' }, 'io.modelcontextprotocol/clientCapabilities': {} } } }
const curlFor = (url, body, extra = []) => `curl -s -X POST '${url}' -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream'${extra.map((h) => ` -H '${h}'`).join('')} -d '${JSON.stringify(body)}'`

export async function mcpEndpointCheck(listing, ctx) {
  const candidates = endpointCandidates(listing)
  if (!candidates.length) return mk('mcp_endpoint', 'not_applicable', 'The listing names no remote MCP address.', 'See the listing page.')
  return firstReadable(candidates, (url) => handshake(url, ctx))
}

/** One initialize POST; if the server does not know it, one server/discover POST. Nothing else is ever sent. */
export async function handshake(url, ctx) {
  const how = curlFor(url, INIT_BODY)
  const post = (body, extra = {}) => safeFetch(url, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...extra }, body: JSON.stringify(body), cap: 256_000, stop: (t) => Boolean(ctx.lib.parseHandshakeBody(t) || ctx.lib.parseDiscoverBody(t)) })
  const ok = (who, how2) => mk('mcp_endpoint', 'pass', `${url} answers the MCP handshake as "${who.serverName}"${who.version ? ` version ${who.version}` : ''}.`, how2)
  try {
    const r = await post(INIT_BODY)
    const auth = ctx.lib.parseAuthChallenge(r.status, r.headers.get('www-authenticate'))
    if (auth) return mk('mcp_endpoint', 'pass', `${url} is reachable and sign-in is required.`, how)
    const who = r.status < 300 ? ctx.lib.parseHandshakeBody(r.text) : null
    if (who) return ok(who, how)
    const rpcError = ctx.lib.isJsonRpcError(r.text)
    // A modern-only server rejects initialize (HTTP 400, or 404 with a JSON-RPC error body), so ask server/discover once.
    if ((r.status === 400 || r.status === 404 || r.status < 300) && (rpcError || r.status === 400)) {
      const d = await post(DISCOVER_BODY, { 'mcp-protocol-version': '2026-07-28', 'mcp-method': 'server/discover' })
      const howD = curlFor(url, DISCOVER_BODY, ['MCP-Protocol-Version: 2026-07-28', 'Mcp-Method: server/discover'])
      if (ctx.lib.parseAuthChallenge(d.status, d.headers.get('www-authenticate'))) return mk('mcp_endpoint', 'pass', `${url} is reachable and sign-in is required.`, howD)
      const who2 = d.status < 300 ? ctx.lib.parseDiscoverBody(d.text) : null
      if (who2) return ok(who2, howD)
      return mk('mcp_endpoint', 'unknown', `${url} answered, but not with a handshake this check can read (initialize HTTP ${r.status}, server/discover HTTP ${d.status}).`, how)
    }
    if (r.status === 404 && !rpcError) return mk('mcp_endpoint', 'fail', `${url} answered HTTP 404: the listed MCP address is gone.`, how)
    return mk('mcp_endpoint', 'unknown', `${url} answered HTTP ${r.status} to the handshake, which this check cannot read as an MCP answer.`, how)
  } catch (e) {
    const p = classifyError(e)
    if (p.kind === 'refused') return mk('mcp_endpoint', 'fail', `Connection refused at ${url}: the listed MCP address is gone.`, how)
    if (p.kind === 'dns') return mk('mcp_endpoint', 'fail', `The name in ${url} does not resolve: the listed MCP address is gone.`, how)
    return mk('mcp_endpoint', 'unknown', errObserved(p, 'The MCP handshake could not be checked'), how)
  }
}

// ---------------------------------------------------------- repo, registry ----

function githubRepoOf(listing) {
  for (const u of [listing.mcp_repo_url, listing.external_url]) {
    try {
      const url = new URL(u)
      if (url.hostname.toLowerCase() !== 'github.com') continue
      const [owner, repo] = url.pathname.split('/').filter(Boolean)
      if (owner && repo && /^[\w.-]+$/.test(owner) && /^[\w.-]+$/.test(repo)) return `${owner}/${repo.replace(/\.git$/, '')}`
    } catch { /* not a URL */ }
  }
  return null
}

export async function repoCheck(listing, ctx) {
  const name = githubRepoOf(listing)
  if (!name) return mk('repo', 'not_applicable', 'The listing names no GitHub repository.', 'See the listing page.')
  const how = `curl -s https://api.github.com/repos/${name}`
  const done = (info) => {
    if (info.missing) return mk('repo', 'warn', `GitHub has no public repository ${name} (it may be renamed, deleted or private).`, how)
    if (info.archived) return mk('repo', 'warn', `The GitHub repository ${name} is archived; its last push was ${info.pushed}.`, how)
    return mk('repo', 'pass', `The GitHub repository ${name} exists and is not archived; its last push was ${info.pushed}.`, how)
  }
  const hit = ctx.cache.repo[name]
  if (hit && Date.now() - hit.at < REPO_TTL) return done(hit)
  if (ctx.ghLimited) return mk('repo', 'unknown', 'Not checked: the GitHub limit of 60 unauthenticated requests an hour was reached.', how)
  return memo(ctx, `repo|${name}`, async () => {
    try {
      const r = await safeFetch(`https://api.github.com/repos/${name}`, { headers: { accept: 'application/vnd.github+json' }, cap: 1_000_000 })
      if (r.status === 403 || r.status === 429) { ctx.ghLimited = true; return mk('repo', 'unknown', 'Not checked: the GitHub limit of 60 unauthenticated requests an hour was reached.', how) }
      if (r.status === 404) { const info = { missing: true, at: Date.now() }; ctx.cache.repo[name] = info; return done(info) }
      if (r.status !== 200) return mk('repo', 'unknown', `GitHub answered HTTP ${r.status}, so the repository was not checked.`, how)
      const json = JSON.parse(r.text)
      const info = { archived: json.archived === true, pushed: String(json.pushed_at ?? '').slice(0, 10) || 'unknown', at: Date.now() }
      ctx.cache.repo[name] = info
      if (Number(r.headers.get('x-ratelimit-remaining')) === 0) ctx.ghLimited = true
      return done(info)
    } catch (e) { return mk('repo', 'unknown', errObserved(classifyError(e), 'GitHub could not be read'), how) }
  })
}

export async function registryCheck(listing, ctx) {
  const domain = ctx.lib.registrableDomain(listing.external_url)
  if (!domain || SHARED_DOMAINS.has(domain)) return mk('registry', 'not_applicable', 'The listing sits on a shared host, so no namespace can be matched to it.', 'See the listing page.')
  const term = domain.split('.')[0]
  const how = `curl -s 'https://registry.modelcontextprotocol.io/v0.1/servers?search=${term}'`
  const ep = endpointOf(listing)
  try {
    const res = await fetch(`https://registry.modelcontextprotocol.io/v0.1/servers?search=${encodeURIComponent(term)}`, { headers: { accept: 'application/json', 'user-agent': UA }, signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!res.ok) return mk('registry', 'unknown', `The official MCP registry answered HTTP ${res.status}, so it was not checked.`, how)
    const match = ctx.lib.parseRegistryMatch(JSON.parse((await readCapped(res, CAP_BYTES))), { endpointHost: ep ? hostOfUrl(ep.url) : hostOfUrl(listing.external_url), domain })
    if (!match) return mk('registry', 'unknown', 'No entry in the official MCP registry matched this listing. Absence proves nothing either way.', how)
    return mk('registry', 'pass', `Listed as ${match.namespace}${match.since ? ` since ${match.since}` : ''}; the registry confirms control of that namespace, not quality.`, how)
  } catch (e) { return mk('registry', 'unknown', errObserved(classifyError(e), 'The official MCP registry could not be read'), how) }
}

// ---------------------------------------------------------------- driver ----

const safely = async (id, fn) => { try { return await fn() } catch (e) { return mk(id, 'unknown', `The check did not run (${String(e?.message ?? e).slice(0, 80)}).`, 'Run: node scripts/realness.mjs --slug SLUG') } }

/** One listing (claims object with slug, external_url, mcp_repo_url ...) to one record. */
export async function checkListing(listing, ctx) {
  const domain = ctx.lib.registrableDomain(listing.external_url)
  const host = hostOfUrl(listing.external_url)
  const checks = [
    await safely('site', () => siteCheck(listing.external_url, ctx)),
    await safely('domain_age', () => domainAgeCheck(domain, ctx)),
    await safely('mail', () => mailCheck(domain, ctx)),
    await safely('security_resolver', () => securityResolverCheck(host, ctx)),
    await safely('mcp_endpoint', () => mcpEndpointCheck(listing, ctx)),
    await safely('repo', () => repoCheck(listing, ctx)),
    await safely('registry', () => registryCheck(listing, ctx)),
  ]
  const { level, reasons } = ctx.lib.judge(checks, ctx.today)
  return { slug: listing.slug, checked_at: ctx.today, level, reasons, checks }
}

export async function checkMany(listings, ctx, onDone = () => {}) {
  const out = new Array(listings.length); let next = 0
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, listings.length) }, async () => {
    for (;;) { const i = next++; if (i >= listings.length) return; out[i] = await checkListing(listings[i], ctx); onDone(out[i]) }
  }))
  return out
}

/** For scripts/admit-submissions.mjs: (listing, slug) => record, with one shared context and cache. */
export async function realnessProvider() {
  const ctx = await createContext()
  const provider = async (listing, slug) => { const rec = await checkListing({ ...listing, slug }, ctx); await saveCache(ctx.cache).catch(() => {}); return rec }
  return provider
}

// ------------------------------------------------------------ file and CLI ----

const sortRecords = (records) => Object.fromEntries(Object.entries(records).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
export const serialize = (records, generated_at) => JSON.stringify({ generated_at, records: sortRecords(records) }, null, 2) + '\n'
const strip = (r) => ({ ...r, checked_at: undefined })

/** What changed between a committed file and a fresh run, ignoring the check date. */
export function diffRecords(before, after) {
  const lines = []
  for (const slug of Object.keys(after).sort()) {
    const a = after[slug], b = before[slug]
    if (!b) { lines.push(`NEW ${slug}: ${a.level}${a.reasons.length ? ` (${a.reasons.join('; ')})` : ''}`); continue }
    if (a.level !== b.level) lines.push(`CHANGED ${slug}: level ${b.level} -> ${a.level}${a.reasons.length ? ` (${a.reasons.join('; ')})` : ''}`)
    for (const c of a.checks) {
      const old = b.checks.find((x) => x.id === c.id)
      if (!old) lines.push(`CHANGED ${slug}: new check ${c.id} ${c.result}`)
      else if (old.result !== c.result) lines.push(`CHANGED ${slug}: ${c.id} ${old.result} -> ${c.result}: ${c.observed}`)
      else if (old.observed !== c.observed) lines.push(`NOTE ${slug}: ${c.id} wording changed: ${c.observed}`)
    }
  }
  for (const slug of Object.keys(before).sort()) if (!after[slug]) lines.push(`GONE ${slug}: no longer in the catalog records`)
  return lines
}

// Claude Sonnet 5.5, 2026-11-23: --json output for a daily runner in another repo that parses this script. One fixed shape.
/** results: fresh records. before: committed records by slug in --check mode, else null (changed stays empty). */
export function summaryJson(results, before) {
  const line = (r) => r.reasons.join('; ') || r.level
  const changed = []
  for (const r of before ? results : []) {
    for (const c of r.checks) {
      const old = before[r.slug]?.checks.find((x) => x.id === c.id)
      if (old && old.result !== c.result) changed.push({ slug: r.slug, check: c.id, from: old.result, to: c.result })
    }
  }
  return {
    checked: results.length,
    findings: results.filter((r) => r.level === 'fail').map((r) => ({ slug: r.slug, level: 'fail', reason: line(r) })),
    watch: results.filter((r) => r.level === 'watch').map((r) => ({ slug: r.slug, reason: line(r) })),
    changed,
  }
}

export function reportTable(records) {
  const cell = (r, id) => r.checks.find((c) => c.id === id)?.result ?? '-'
  const rows = Object.values(records).sort((a, b) => (a.slug < b.slug ? -1 : 1)).map((r) => {
    const age = r.checks.find((c) => c.id === 'domain_age')
    return `| ${r.slug} | ${r.level} | ${cell(r, 'site')} | ${age?.value ?? cell(r, 'domain_age')} | ${cell(r, 'mail')} | ${cell(r, 'security_resolver')} | ${cell(r, 'mcp_endpoint')} | ${cell(r, 'repo')} | ${cell(r, 'registry')} |`
  })
  return ['| Listing | Level | Site | Registered | Mail | Security DNS | MCP | Repo | Registry |', '|---|---|---|---|---|---|---|---|---|', ...rows].join('\n')
}

const USAGE = 'Usage: node scripts/realness.mjs (--all | --slug S ... | --plan PLAN.json | --endpoint URL) [--write] [--check] [--report] [--json]'

async function main() {
  const argv = process.argv.slice(2)
  const values = (flag) => argv.flatMap((a, i) => (a === flag ? [argv[i + 1]] : [])).filter((v) => v && !v.startsWith('--'))
  const known = new Set(['--all', '--slug', '--plan', '--endpoint', '--write', '--check', '--report', '--json', '--no-cache'])
  const valueFlags = new Set(['--slug', '--plan', '--endpoint'])
  const bad = argv.filter((a, i) => (a.startsWith('--') ? !known.has(a) : !valueFlags.has(argv[i - 1])))
  if (bad.length) throw Error(USAGE)
  const all = argv.includes('--all'), write = argv.includes('--write'), check = argv.includes('--check'), report = argv.includes('--report')
  // With --json stdout carries one JSON object and nothing else; every human line goes to stderr.
  const json = argv.includes('--json')
  const say = json ? console.error : console.log
  const slugs = values('--slug'), planFile = values('--plan')[0], endpoint = values('--endpoint')[0]
  if (!all && !slugs.length && !planFile && !endpoint) throw Error(USAGE)
  if ((planFile || endpoint) && (write || check)) throw Error('--plan and --endpoint never write or compare; drop --write and --check')
  if (write && check) throw Error('--write and --check are separate runs')

  const ctx = await createContext({ useCache: !argv.includes('--no-cache') })

  if (endpoint) {
    const rec = await handshake(endpoint, ctx)
    console.log(JSON.stringify(rec, null, 2))
    process.exitCode = rec.result === 'fail' ? 1 : 0
    return
  }

  const reviews = JSON.parse(await readFile(REVIEWS, 'utf8')).reviews
  let listings
  if (planFile) {
    const plan = JSON.parse(await readFile(resolve(planFile), 'utf8'))
    const { loadCatalogGate } = await import('./import-reviewed-catalog.mjs')
    const gate = await loadCatalogGate()
    listings = (plan.admit ?? []).map((item) => ({ ...gate.catalogClaims({ ...item.listing, slug: gate.generateSlug(item.listing.name) }) }))
  } else {
    listings = reviews.map((r) => ({ ...r.claims, slug: r.slug }))
    if (!all) {
      const missing = slugs.filter((s) => !listings.some((l) => l.slug === s))
      if (missing.length) throw Error(`No review record for: ${missing.join(', ')}`)
      listings = listings.filter((l) => slugs.includes(l.slug))
    }
  }

  const results = await checkMany(listings, ctx)
  await saveCache(ctx.cache).catch(() => {})
  const fresh = Object.fromEntries(results.map((r) => [r.slug, r]))

  let existing = { generated_at: null, records: {} }
  try { existing = JSON.parse(await readFile(OUT, 'utf8')) } catch { /* first run */ }

  if (check) {
    const scope = all ? existing.records : Object.fromEntries(Object.entries(existing.records).filter(([s]) => fresh[s]))
    const changes = diffRecords(Object.fromEntries(Object.entries(scope).map(([k, v]) => [k, v])), fresh)
    say(changes.length ? changes.join('\n') : `No change in ${results.length} records (ignoring the check date).`)
  }
  if (write) {
    const merged = all ? fresh : { ...existing.records, ...fresh }
    const temp = `${OUT}.${process.pid}.tmp`
    await writeFile(temp, serialize(merged, ctx.today)); await rename(temp, OUT)
    say(`Wrote ${Object.keys(merged).length} records to lib/catalog-realness.json`)
  }
  if (report) say(reportTable(fresh))
  else if (!check) for (const r of results) say(`${r.level.toUpperCase().padEnd(5)} ${r.slug}${r.reasons.length ? `: ${r.reasons.join('; ')}` : ''}`)
  const counts = results.reduce((n, r) => ({ ...n, [r.level]: (n[r.level] ?? 0) + 1 }), {})
  console.error(`realness: ${results.length} checked, ${counts.pass ?? 0} pass, ${counts.watch ?? 0} watch, ${counts.fail ?? 0} fail`)
  if (json) console.log(JSON.stringify(summaryJson(results, check ? existing.records : null)))
  if (results.some((r) => r.level === 'fail')) process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch((e) => { console.error(e.message); process.exitCode = 2 })
