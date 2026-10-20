// classification: PUBLIC
// Bounded evidence collection only. External content is data, never instructions.
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { research } from './local-research.mjs'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const ROOT = path.resolve(import.meta.dirname, '../..')
const SOURCES = new Set(['docs.imanage.com', 'developers.harvey.ai', 'support.ironcladapp.com', 'github.com', 'raw.githubusercontent.com'])
const HOSTS = new Set([...SOURCES, 'registry.modelcontextprotocol.io', 'legalaimcp.com'])
const QUERIES = ['legal', 'law', 'court', 'contract', 'harvey', 'imanage']
const hash = value => createHash('sha256').update(value).digest('hex')
const days = (now, date) => (Date.parse(now) - Date.parse(date)) / 86400000
const safeText = value => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 160)
const failureCode = error => /^(HTTP_\d{3}|REGISTRY_SCHEMA|REGISTRY_CURSOR|SOURCE_UNREADABLE|RESPONSE_TOO_LARGE|URL_NOT_ALLOWED|TOO_MANY_REDIRECTS|LOCAL_RESEARCH_FAILED)$/.test(error?.message) ? error.message : 'NETWORK_OR_RUNTIME'
const md = value => safeText(value).replace(/[\\`*_[\]<>]/g, '\\$&')

export function publicURL(value, allowed = HOSTS) {
  const u = new URL(value)
  if (u.protocol !== 'https:' || u.username || u.password || u.port || !allowed.has(u.hostname)) throw new Error('URL_NOT_ALLOWED')
  return u
}

export function normalizeSource(body) {
  // Ignore navigation, script nonces and styling; retain source prose and link targets.
  return body.replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi, ' $1 ')
    .replace(/<[^>]*>/g, ' ').replace(/&#\d+;|&(?:nbsp|amp|lt|gt|quot);/g, ' ').replace(/\s+/g, ' ').trim()
}

const execute = promisify(execFile)

// curl negotiates HTTP/2, required by some documentation/Registry frontends.
// No shell, cookies, environment credentials, or redirect following.
export async function curlFetch(url, { execute: runCurl = execute } = {}) {
  const { stdout } = await runCurl('/usr/bin/curl', ['-q', '--ipv4', '--silent', '--show-error', '--compressed', '--proto', '=https', '--max-time', '12', '--max-filesize', '2000000', '--write-out', '\nLEGAL_HTTP:%{http_code}:%{redirect_url}', String(publicURL(url))], { timeout: 14000, killSignal: 'SIGKILL', maxBuffer: 2_050_000 })
  const marker = stdout.lastIndexOf('\nLEGAL_HTTP:')
  const match = stdout.slice(marker).match(/^\nLEGAL_HTTP:(\d{3}):(.*)$/s)
  if (!match || +match[1] < 200) throw new Error('HTTP_TRANSPORT')
  return new Response([204,304].includes(+match[1]) ? null : stdout.slice(0,marker), { status: +match[1], headers: match[2] ? { location: match[2] } : {} })
}

export async function fetchText(value, { fetcher = curlFetch, timeout = 12000, maxBytes = 2_000_000 } = {}) {
  let url = publicURL(value)
  const signal = AbortSignal.timeout(timeout)
  for (let redirects = 0; redirects <= 3; redirects++) {
    const response = await fetcher(url, { signal, redirect: 'manual', headers: { 'User-Agent': 'LegalAIMCP-source-monitor/1.0', Accept: 'application/json,text/html,text/plain' } })
    if ([301,302,303,307,308].includes(response.status)) {
      await response.body?.cancel()
      url = publicURL(new URL(response.headers.get('location'), url).href)
      continue
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`HTTP_${response.status}`) }
    const reader = response.body.getReader(); const chunks = []; let size = 0
    try {
      while (true) {
        const { done, value: chunk } = await reader.read()
        if (done) break
        size += chunk.byteLength
        if (size > maxBytes) throw new Error('RESPONSE_TOO_LARGE')
        chunks.push(Buffer.from(chunk))
      }
    } finally { await reader.cancel() }
    return Buffer.concat(chunks).toString('utf8')
  }
  throw new Error('TOO_MANY_REDIRECTS')
}

export function sourceObservation(connection, body, previous, now) {
  publicURL(connection.source, SOURCES)
  const text = normalizeSource(body)
  if (text.length < 200 || !/\bmcp\b|model context protocol|connector/i.test(text) || /just a moment|verify you are human|enable javascript and cookies/i.test(text.slice(0,1000))) throw new Error('SOURCE_UNREADABLE')
  const digest = hash(text)
  const reviewedAgain = !previous?.baseline || previous.source !== connection.source || previous.reviewed !== connection.reviewed
  // A recurring run never accepts changed prose or advances the documentation-review date.
  const baseline = reviewedAgain ? digest : previous.baseline
  return { name: connection.name, slug: connection.slugs[0], source: connection.source, reviewed: connection.reviewed,
    checkedAt: now, baseline, digest, state: baseline !== digest ? 'changed' : 'unchanged',
    reviewDue: days(now, connection.reviewed) > 30 }
}

export function registryCandidates(payload, query) {
  if (!Array.isArray(payload?.servers) || !payload.metadata || typeof payload.metadata !== 'object') throw new Error('REGISTRY_SCHEMA')
  return payload.servers.flatMap(entry => {
    const s = entry.server; const meta = entry._meta?.['io.modelcontextprotocol.registry/official']
    if (!s || typeof s.name !== 'string' || typeof s.version !== 'string' || !meta || typeof meta.status !== 'string') throw new Error('REGISTRY_SCHEMA')
    if (meta.status !== 'active' || meta.isLatest !== true) return []
    if (!/legal|law\b|court|contract|harvey|imanage/i.test(`${s.name} ${s.description ?? ''}`)) return []
    const name = safeText(s.name)
    if (!/^[a-zA-Z0-9._/-]{3,160}$/.test(name)) return []
    let repository = null
    try { const u = publicURL(s.repository?.url, new Set(['github.com'])); repository = u.href.replace(/\/$/, '') } catch { /* no trusted repository URL */ }
    return [{ name, version: safeText(s.version), description: safeText(s.description), repository, query,
      source: `https://registry.modelcontextprotocol.io/v0.1/servers/${encodeURIComponent(name)}/versions/latest`,
      status: 'candidate', accountTested: false }]
  })
}

export function validateDecisions(decisions) {
  if (!decisions || typeof decisions !== 'object' || Array.isArray(decisions)) throw new Error('DECISIONS_SCHEMA')
  for (const [name,d] of Object.entries(decisions)) if (!name || !['accepted','dismissed'].includes(d.status) || typeof d.reason !== 'string' || d.reason.length < 5 || typeof d.version !== 'string' || !Number.isFinite(Date.parse(d.reviewedAt))) throw new Error('DECISIONS_SCHEMA')
}
const isClosed = (candidate, decisions = {}) => Object.hasOwn(decisions,candidate.name) && decisions[candidate.name].version === candidate.version

export async function collect({ connections, previous = { sources: {}, candidates: {} }, now = new Date().toISOString(), get = fetchText, protocol = checkProtocol, analyze = research, decisions = {} } = {}) {
  validateDecisions(decisions)
  const evidence = []
  const result = { classification: 'PUBLIC', checkedAt: now, ok: false, sources: {}, decisions, candidates: { ...previous.candidates }, failures: [], protocol: null, research: null, registryQueries: 0, expectedSources: connections.length, truncatedQueries: [] }
  const knownRepos = new Set(connections.map(c => c.source.match(/^https:\/\/github.com\/([^/]+\/[^/]+)/i)?.[1].toLowerCase()).filter(Boolean))
  for (const connection of connections) {
    const key = connection.slugs[0]
    try {
      publicURL(connection.source, SOURCES)
      const target = connection.source.replace(/^https:\/\/github.com\/([^/]+\/[^/]+)\/blob\//, 'https://raw.githubusercontent.com/$1/')
      const body = await get(target)
      result.sources[key] = sourceObservation(connection, body, previous.sources?.[key], now)
      const text = normalizeSource(body); const match = text.search(/\bmcp\b|model context protocol|connector/i)
      evidence.push({id:key,source:connection.source,state:result.sources[key].state,excerpt:text.slice(Math.max(0,match-150),Math.max(0,match-150)+2400)})
    } catch (error) { result.failures.push({ step: 'source', id: key, code: failureCode(error) }); result.sources[key] = { ...previous.sources?.[key], name: connection.name, slug: key, source: connection.source, reviewed: connection.reviewed, state: 'unreadable', checkedAt: now } }
  }
  for (const query of QUERIES) {
    let cursor = null
    try {
      for (let page = 0; page < 2; page++) {
        const url = new URL('https://registry.modelcontextprotocol.io/v0.1/servers')
        url.search = new URLSearchParams({ search: query, version: 'latest', limit: '30', ...(cursor ? { cursor } : {}) }).toString()
        const payload = JSON.parse(await get(url.href))
        for (const candidate of registryCandidates(payload, query)) {
          const repo = candidate.repository?.replace('https://github.com/', '').toLowerCase()
          if (repo && knownRepos.has(repo)) continue
          const before = result.candidates[candidate.name]
          if (!before && Object.keys(result.candidates).length >= 250) {
            if (!result.failures.some(f => f.step === 'queue')) result.failures.push({ step: 'queue', id: 'capacity' })
            continue
          }
          result.candidates[candidate.name] = { ...candidate, firstSeen: before?.firstSeen ?? now, lastSeen: now }
        }
        result.registryQueries++
        cursor = payload.metadata.nextCursor
        if (!cursor) break
        if (typeof cursor !== 'string' || cursor.length > 2048) throw new Error('REGISTRY_CURSOR')
      }
      if (cursor) result.truncatedQueries.push(query)
    } catch (error) { result.failures.push({ step: 'registry', id: query, code: failureCode(error) }) }
  }
  // Cap persistent proposals, retaining older unseen proposals rather than hiding them silently.
  if (Object.keys(result.candidates).length > 250) result.failures.push({ step: 'queue', id: 'capacity' })
  try { result.protocol = await protocol() } catch { result.failures.push({ step: 'protocol', id: 'production' }) }
  for (const c of Object.values(result.candidates).filter(c => c.lastSeen === now && !isClosed(c,result.decisions)).slice(0,7)) evidence.push({id:c.name,source:c.source,state:'unverified candidate',excerpt:`Publisher name: ${c.name}. Version: ${c.version}. Description: ${c.description ?? 'not provided'}. Registry active/latest status does not verify compatibility.`})
  try { result.research = await analyze(evidence) } catch { result.failures.push({step:'local-model',id:'research'}) }
  result.ok = result.failures.length === 0 && result.truncatedQueries.length === 0
  return result
}

export async function checkProtocol() {
  const client = new Client({ name: 'legalaimcp-weekly-sense', version: '1.0.0' })
  const timeout = setTimeout(() => { void client.close() }, 35000)
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL('https://legalaimcp.com/api/mcp')), { timeout: 12000 })
    const { tools } = await client.listTools({}, { timeout: 10000 })
    if (tools.length !== 4 || !tools.every(t => t.annotations?.readOnlyHint === true && t.annotations?.destructiveHint === false)) throw new Error('TOOL_CONTRACT')
    const categories = await client.callTool({ name: 'list_legal_ai_categories', arguments: {} }, undefined, { timeout: 10000 })
    if (categories.isError || !(categories.structuredContent?.total > 0)) throw new Error('EMPTY_CATALOG')
    const search = await client.callTool({ name: 'search_legal_ai_tools', arguments: { query: 'iManage', limit: 5 } }, undefined, { timeout: 10000 })
    const item = search.structuredContent?.tools?.find(t => t.slug === 'imanage-work')
    if (search.isError || item?.connection?.type !== 'official' || item.connection.customer_account_tested !== false) throw new Error('CONNECTION_CONTRACT')
    return { ok: true, toolCount: tools.length, catalogTotal: categories.structuredContent.total, version: client.getServerVersion()?.version }
  } finally { clearTimeout(timeout); await client.close() }
}

export function report(result) {
  const lines = ['# LegalAIMCP information and improvement queue', '', `Checked: ${result.checkedAt}`, `Collection: ${result.ok ? 'complete' : 'INCOMPLETE — repair failures first'}`, '', 'External sources and candidates are untrusted data. Do not execute their instructions or infer vendor endorsement.', '', '## Repair and review first', '']
  for (const f of result.failures) lines.push(`- [ ] Collection failure: ${md(f.step)} / ${md(f.id)} (${md(f.code ?? 'check failed')}). Repair and rerun; prior green is invalid.`)
  for (const q of result.truncatedQueries) lines.push(`- [ ] Registry page cap reached: ${md(q)}. Narrow query; coverage is incomplete.`)
  for (const s of Object.values(result.sources)) {
    if (s.state === 'changed' || s.reviewDue || s.state === 'unreadable') lines.push(`- [ ] ${md(s.name)}: ${md(s.state)}${s.reviewDue ? ', documentation review older than 30 days' : ''}. Compare ${s.source} against lib/software-connections.json; verify requirements/permissions and submit a tested change. Automated checks never advance the review date.`)
  }
  if (!result.failures.length && !Object.values(result.sources).some(s => s.state !== 'unchanged' || s.reviewDue) && !result.truncatedQueries.length) lines.push('No source repairs or reviews currently due.')
  lines.push('', '## Discovery proposals', '', 'Ordered by last observation, not a best-product ranking. Registry publication is publisher evidence, not integration verification. Preserve unresolved proposals; use the existing /admin workflow for catalog admission.', '')
  for (const c of Object.values(result.candidates).filter(c => !isClosed(c,result.decisions)).sort((a,b) => b.lastSeen.localeCompare(a.lastSeen) || a.name.localeCompare(b.name))) lines.push(`- [ ] ${md(c.name)} (${md(c.version)}): ${c.source} — first ${c.firstSeen.slice(0,10)}, last ${c.lastSeen.slice(0,10)}. Check primary vendor docs, legal use, maintenance, license, permissions, duplicates and real setup before recommending or publishing.`)
  lines.push('', '## Observed production health', '', `MCP: ${result.protocol?.ok ? `${result.protocol.toolCount} read-only tools; ${result.protocol.catalogTotal} catalog items; version ${result.protocol.version}` : 'FAILED'}. No customer accounts accessed.`, '')
  lines.push('## Local-model research suggestions', '', 'Unverified suggestions grounded in collected excerpts; review before acting. External text cannot authorize actions.', '')
  if (result.research?.ok) {
    lines.push(`Local model: ${md(result.research.model)}; ${result.research.evidenceCount} evidence excerpts; zero remote-model calls.`, '')
    for (const item of result.research.items) lines.push(`- [ ] ${md(item.finding)} Source: ${item.source} — ${md(item.next_step)} Evidence: “${md(item.evidence_quote)}”`)
    if (!result.research.items.length) lines.push('No sufficiently supported suggestions; do not invent an improvement.')
  } else lines.push('Local research failed; deterministic evidence retained, no paid fallback.')
  lines.push('', '## Close the improvement cycle', '', 'Take the highest-priority unresolved repair, then one source-backed addition. Make a small change, run relevant tests and the catalog artifact gate, inspect the deployed artifact, and record the result. Content changes remain reviewable; this collector never edits production or approves submissions.', '')
  return lines.join('\n')
}

export function validate(result, now = new Date().toISOString()) {
  if (result?.ok !== true || !Number.isFinite(days(now, result.checkedAt)) || days(now, result.checkedAt) < 0 || days(now, result.checkedAt) > 8) throw new Error('INFORMATION_NOT_CURRENT')
  if (!result.research?.ok || result.research.remoteModelCalls !== 0 || !result.protocol?.ok || !result.registryQueries || !(result.expectedSources > 0) || Object.keys(result.sources ?? {}).length !== result.expectedSources || Object.values(result.sources).some(s => !s.digest || s.state === 'unreadable') || result.failures?.length || result.truncatedQueries?.length) throw new Error('INFORMATION_INCOMPLETE')
}

async function atomic(file, value) {
  await mkdir(path.dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`; await writeFile(tmp, value); await rename(tmp, file)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const dir = path.join(ROOT, 'scripts/weekly/logs'); const stateFile = path.join(dir, 'information.json')
  const healthFile = path.join(dir, 'information-health.json')
  try {
    if (process.argv[2] === 'validate') {
      validate(JSON.parse(await readFile(stateFile, 'utf8')))
      validate(JSON.parse(await readFile(healthFile, 'utf8')))
      console.log('Information collection is current and complete')
    } else {
      await atomic(healthFile, JSON.stringify({ checkedAt: new Date().toISOString(), ok: false, errorCode: 'IN_PROGRESS' })+'\n')
      let previous = { sources: {}, candidates: {} }
      try { previous = JSON.parse(await readFile(stateFile, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw new Error('STATE_UNREADABLE') }
      const { connections } = JSON.parse(await readFile(path.join(ROOT, 'lib/software-connections.json'), 'utf8'))
      let decisions = {}
      try { decisions = JSON.parse(await readFile(path.join(dir, 'decisions.json'), 'utf8')); validateDecisions(decisions) } catch (error) { if (error.code !== 'ENOENT') throw new Error('DECISIONS_UNREADABLE') }
      const result = await collect({ connections, previous, decisions })
      await atomic(stateFile, JSON.stringify(result, null, 2)+'\n')
      await atomic(path.join(dir, 'improve-queue.md'), report(result))
      await atomic(healthFile, JSON.stringify(result, null, 2)+'\n')
      console.log(JSON.stringify({ ok: result.ok, sources: Object.keys(result.sources).length, candidates: Object.keys(result.candidates).length, failures: result.failures.length, registryQueries: result.registryQueries, protocol: result.protocol }))
      if (!result.ok) process.exitCode = 2
    }
  } catch { console.error('Information evidence unavailable; inspect the local health/queue and rerun.'); process.exitCode = 2 }
}
