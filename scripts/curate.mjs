#!/usr/bin/env node
/**
 * curate — keeps the directory growing and accurate without manual trawling.
 *
 *   node scripts/curate.mjs discover [--min-stars N] [--limit N] [--dry-run]
 *   node scripts/curate.mjs check-links [--json]
 *   node scripts/curate.mjs verify [--dry-run]
 *
 * A directory lives or dies on two things: coverage and accuracy. `discover`
 * feeds the first, `check-links` protects the second — a directory full of
 * dead links is worse than no directory.
 *
 * `verify` is `check-links` with teeth: it writes the result back, so the
 * public "Verified" badge is a record of a check that actually ran rather than
 * an adjective someone typed. The site's copy now promises that published
 * links are re-checked automatically and dead tools get pulled; this command
 * is the thing that makes that sentence true. If you ever disable it, change
 * the copy in the same commit.
 *
 * DESIGN NOTE — why this writes to `submissions` and not `listings`:
 * the site already has a submit -> admin-approve pipeline, and RLS allows
 * anonymous INSERT on submissions ("Public can submit") but not on listings.
 * So the bot walks through the same front door a human would, using the same
 * anon key the site already ships. No service-role key, no new trust surface,
 * and everything lands in the queue you already review at /admin. Nothing this
 * script proposes can reach the public site without you approving it.
 *
 * Dedupe: published listings are readable with the anon key, but submissions
 * are INSERT-only, so pending proposals can't be read back. A local seen-file
 * stops the same repo being re-proposed on every run.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

const run = promisify(execFile)
const ROOT = path.resolve(import.meta.dirname, '..')
const SEEN_FILE = path.join(ROOT, 'scripts', 'curate-seen.json')

const argv = process.argv.slice(2)
const cmd = argv[0]
const flag = (n, d) => {
  const i = argv.indexOf(`--${n}`)
  return i === -1 ? d : Number(argv[i + 1])
}
const has = (n) => argv.includes(`--${n}`)

const log = (...a) => console.log('[curate]', ...a)

// ------------------------------------------------------------------- env ----

async function loadEnv() {
  const file = path.join(ROOT, '.env.local')
  if (!existsSync(file)) throw new Error('.env.local not found')
  const out = {}
  for (const line of (await readFile(file, 'utf8')).split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  const url = out.NEXT_PUBLIC_SUPABASE_URL
  const key = out.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY in .env.local')
  return createClient(url, key)
}

// ------------------------------------------------------------- discovery ----

/**
 * Queries are deliberately narrow. A broad "mcp server" sweep returns
 * thousands of irrelevant repos and floods the review queue, which is worse
 * than finding nothing — a queue nobody wants to open stops being reviewed.
 */
const QUERIES = [
  'legal mcp server',
  'law firm mcp server',
  'contract analysis mcp',
  'legal research mcp',
  'court records mcp server',
  'case law mcp',
  'legal ai agent tool',
  'compliance mcp server',
]

/** Maps repo text to the site's listing_category enum. Order matters — first hit wins. */
const CATEGORY_RULES = [
  ['document_processing', /contract|document|pdf|redline|clause|discovery|ediscovery/i],
  ['legal_research', /research|case ?law|citation|statute|precedent|court|docket|opinion/i],
  ['case_management', /case ?management|matter|practice ?management|intake|workflow/i],
  ['billing_time', /billing|invoice|time ?track|timekeep|expense/i],
  ['compliance', /complian|regulat|gdpr|audit|risk|governance|policy/i],
  ['client_communication', /client|communicat|email|chat|intake ?form|crm/i],
]

function inferCategory(text) {
  for (const [cat, re] of CATEGORY_RULES) if (re.test(text)) return cat
  return 'general'
}

async function ghSearch(query, limit) {
  const { stdout } = await run('gh', [
    'search', 'repos', query,
    '--limit', String(limit),
    '--json', 'fullName,description,url,stargazersCount,isArchived,isFork,language,owner,updatedAt',
  ])
  return JSON.parse(stdout)
}

/**
 * Composes listing copy from REAL repo metadata only.
 *
 * The schema requires description >= 50 chars and tagline >= 10, and most
 * GitHub descriptions are shorter than that. We pad with verifiable facts
 * (owner, language, stars, last update) rather than inventing capability
 * claims — this text becomes public copy once approved, and a directory that
 * describes tools it hasn't verified is exactly the credibility problem we're
 * trying to avoid.
 */
function toListing(repo) {
  const desc = (repo.description || '').trim()
  const owner = repo.owner?.login ?? repo.fullName.split('/')[0]
  const name = repo.fullName.split('/')[1].replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const tagline = desc.length >= 10 ? desc.slice(0, 120) : `Open-source legal MCP server by ${owner}`

  const facts = [
    desc,
    `Open-source project by ${owner} on GitHub${repo.language ? `, written in ${repo.language}` : ''}.`,
    `${repo.stargazersCount} stars as of discovery.`,
    'Listing drafted automatically from repository metadata — review and expand before publishing.',
  ].filter(Boolean).join(' ')

  return {
    name: name.slice(0, 100),
    tagline: tagline.slice(0, 120),
    category: inferCategory(`${repo.fullName} ${desc}`),
    external_url: repo.url,
    mcp_repo_url: repo.url,
    mcp_install_command: '',
    pricing_model: 'free',
    pricing_details: 'Open source',
    description: facts.slice(0, 2000),
    creator_name: owner.slice(0, 100),
    creator_url: `https://github.com/${owner}`,
  }
}

async function loadSeen() {
  if (!existsSync(SEEN_FILE)) return { repos: [] }
  try {
    return JSON.parse(await readFile(SEEN_FILE, 'utf8'))
  } catch {
    return { repos: [] }
  }
}

async function discover() {
  const minStars = flag('min-stars', 2)
  const perQuery = flag('limit', 15)
  const dryRun = has('dry-run')

  const supabase = await loadEnv()

  // Published listings are readable anonymously; pending submissions are not.
  const { data: listings, error } = await supabase
    .from('listings')
    .select('name, mcp_repo_url, external_url')
  if (error) throw new Error(`Supabase read failed: ${error.message}`)

  const known = new Set()
  for (const l of listings ?? []) {
    for (const u of [l.mcp_repo_url, l.external_url]) {
      if (u) known.add(u.replace(/\/+$/, '').toLowerCase())
    }
  }
  const seen = await loadSeen()
  for (const u of seen.repos) known.add(u.toLowerCase())

  log(`${listings?.length ?? 0} published listings, ${seen.repos.length} previously proposed`)

  const found = new Map()
  for (const q of QUERIES) {
    let repos = []
    try {
      repos = await ghSearch(q, perQuery)
    } catch (e) {
      log(`  query failed "${q}": ${e.message.split('\n')[0]}`)
      continue
    }
    for (const r of repos) {
      if (r.isArchived || r.isFork) continue
      if (!r.description) continue // no description -> nothing honest to publish
      if (r.stargazersCount < minStars) continue
      const key = r.url.replace(/\/+$/, '').toLowerCase()
      if (known.has(key) || found.has(key)) continue
      found.set(key, r)
    }
  }

  log(`${found.size} new candidate(s) after dedupe and quality filter`)
  if (found.size === 0) return

  const candidates = [...found.values()].sort((a, b) => b.stargazersCount - a.stargazersCount)
  for (const r of candidates) {
    log(`  ${String(r.stargazersCount).padStart(4)}★ ${r.fullName} -> ${inferCategory(`${r.fullName} ${r.description}`)}`)
  }

  if (dryRun) {
    log('dry run — nothing written')
    return
  }

  let inserted = 0
  for (const r of candidates) {
    const listing_data = toListing(r)
    const { error: insErr } = await supabase.from('submissions').insert({
      listing_data,
      submitter_email: 'curate-bot@legalaimcp.com',
      submitter_name: 'Automated discovery',
      notes: `Auto-discovered from GitHub (${r.stargazersCount}★, updated ${String(r.updatedAt).slice(0, 10)}). Verify the tool is real and legal-specific before approving.`,
    })
    if (insErr) {
      log(`  insert failed for ${r.fullName}: ${insErr.message}`)
      continue
    }
    inserted++
    seen.repos.push(r.url.replace(/\/+$/, ''))
  }

  await writeFile(SEEN_FILE, JSON.stringify({ repos: [...new Set(seen.repos)] }, null, 2))
  log(`queued ${inserted} submission(s) for review at /admin`)
}

// ----------------------------------------------------------- link health ----

async function probe(url) {
  if (!url) return null
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 15000)
  try {
    // Some hosts reject HEAD; fall back to a ranged GET before calling it dead.
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal })
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { Range: 'bytes=0-0' } })
    }
    return res.status
  } catch (e) {
    return e.name === 'AbortError' ? 'timeout' : 'error'
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Classifies a probe result into the only three states that matter here.
 *
 * The middle state is the whole point. A 403 from a host that resolved is
 * bot protection, not death — treating it as either "alive" or "dead" is
 * wrong, so it gets its own bucket that changes nothing. This is the guard
 * against the failure mode where an over-eager checker unpublishes real
 * vendors for the crime of using Cloudflare.
 */
function classify(status) {
  if (typeof status === 'number' && status < 400) return 'alive'
  if (status === 401 || status === 403 || status === 429) return 'blocked'
  return 'dead'
}

async function checkLinks() {
  const supabase = await loadEnv()
  const { data: listings, error } = await supabase
    .from('listings')
    .select('name, slug, external_url, mcp_repo_url, status')
    .eq('status', 'published')
  if (error) throw new Error(`Supabase read failed: ${error.message}`)

  const broken = []
  const blocked = []
  for (const l of listings ?? []) {
    for (const [field, url] of [['external_url', l.external_url], ['mcp_repo_url', l.mcp_repo_url]]) {
      if (!url) continue
      const status = await probe(url)
      const row = { slug: l.slug, name: l.name, field, url, status }

      if (typeof status === 'number' && status < 400) {
        process.stdout.write('.')
        continue
      }
      // 401/403/429 from a host that resolves is bot protection, not a dead
      // link — Clio sits behind Cloudflare and refuses scripted clients. If
      // these were reported as broken the report would cry wolf every run, and
      // a check nobody trusts is a check nobody reads.
      if (status === 403 || status === 401 || status === 429) {
        blocked.push(row)
        process.stdout.write('~')
        continue
      }
      broken.push(row)
      process.stdout.write('X')
    }
  }
  process.stdout.write('\n')

  log(`checked ${listings?.length ?? 0} published listing(s)`)

  if (blocked.length) {
    log(`${blocked.length} link(s) bot-blocked (host is alive, verify by hand if suspicious):`)
    for (const b of blocked) log(`  [${b.status}] ${b.name} (${b.slug}): ${b.url}`)
  }

  if (broken.length === 0) {
    log('no broken links')
    if (has('json')) console.log(JSON.stringify({ broken, blocked }, null, 2))
    return
  }

  log(`${broken.length} BROKEN link(s):`)
  for (const b of broken) log(`  [${b.status}] ${b.name} (${b.slug}) ${b.field}: ${b.url}`)
  if (has('json')) console.log(JSON.stringify({ broken, blocked }, null, 2))
  process.exitCode = 1
}

// ---------------------------------------------------------------- verify ----

/** Threshold for auto-unpublish. See MAX_FAILURES note in verify(). */
const MAX_FAILURES = 3

/**
 * Writes through the linked Supabase CLI rather than supabase-js.
 *
 * RLS denies anonymous UPDATE on `listings` (correctly — the public key is
 * shipped to every browser). The alternative would be putting a service-role
 * key in .env.local, which creates a second, far more dangerous secret on disk
 * for a script that runs weekly on one laptop. `supabase db query --linked`
 * already authenticates as postgres through the CLI's own stored credentials,
 * so this adds no new trust surface.
 *
 * Values are escaped rather than parameterized because the CLI takes a SQL
 * string, not bound params. Everything interpolated here is either a literal
 * from this file or a UUID read back from the same database — no user input
 * reaches it — but the escaping stays as defense in depth.
 */
async function sql(query) {
  const { stdout } = await run('supabase', ['db', 'query', '--linked', query], {
    maxBuffer: 10 * 1024 * 1024,
  })
  return stdout
}

const uuid = (v) => {
  if (!/^[0-9a-f-]{36}$/i.test(v)) throw new Error(`refusing non-uuid id: ${v}`)
  return `'${v}'`
}

async function verify() {
  const dryRun = has('dry-run')
  const supabase = await loadEnv()

  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, name, slug, external_url, mcp_repo_url, verified, link_failures')
    .eq('status', 'published')
  if (error) throw new Error(`Supabase read failed: ${error.message}`)

  log(`verifying ${listings?.length ?? 0} published listing(s)`)

  const alive = []
  const dead = []
  const blocked = []

  for (const l of listings ?? []) {
    const urls = [l.external_url, l.mcp_repo_url].filter(Boolean)
    if (urls.length === 0) {
      // No URL is not a passing grade. A listing with nothing to check can
      // never earn a badge that means "we checked it".
      dead.push({ ...l, reason: 'no url to check' })
      process.stdout.write('?')
      continue
    }

    const results = await Promise.all(urls.map(probe))
    const states = results.map(classify)

    if (states.includes('dead')) {
      const i = states.indexOf('dead')
      dead.push({ ...l, reason: `${urls[i]} -> ${results[i]}` })
      process.stdout.write('X')
    } else if (states.includes('blocked')) {
      // Can't confirm, can't condemn. Leave the row exactly as it is.
      blocked.push(l)
      process.stdout.write('~')
    } else {
      alive.push(l)
      process.stdout.write('.')
    }
  }
  process.stdout.write('\n')

  // A listing only gets pulled after MAX_FAILURES consecutive weekly runs —
  // roughly three weeks of being continuously unreachable. Slow on purpose:
  // silently unpublishing a real vendor over a transient outage is a worse
  // failure than showing one stale link, and it is the kind of error nobody
  // notices because the evidence removes itself.
  const toPull = dead.filter((l) => (l.link_failures ?? 0) + 1 >= MAX_FAILURES)

  log(`alive ${alive.length} · bot-blocked ${blocked.length} · unreachable ${dead.length}`)
  for (const d of dead) {
    const n = (d.link_failures ?? 0) + 1
    log(`  [${n}/${MAX_FAILURES}] ${d.name} (${d.slug}) — ${d.reason}`)
  }
  if (toPull.length) {
    log(`${toPull.length} listing(s) hit ${MAX_FAILURES} consecutive failures and will be unpublished:`)
    for (const p of toPull) log(`  PULL ${p.name} (${p.slug})`)
  }

  if (dryRun) {
    log('dry run — nothing written')
    return
  }

  // Batched into three statements rather than one round-trip per listing:
  // 45 listings would otherwise mean 45 CLI invocations, each paying process
  // startup and a fresh connection.
  const statements = []

  if (alive.length) {
    statements.push(
      `UPDATE listings SET verified = TRUE, verified_at = NOW(), link_failures = 0
       WHERE id IN (${alive.map((l) => uuid(l.id)).join(',')});`
    )
  }
  if (dead.length) {
    // verified drops to FALSE immediately on the first failure — the badge
    // makes a present-tense claim, so it should not survive a failed check
    // even while we wait out the pull threshold.
    statements.push(
      `UPDATE listings SET verified = FALSE, link_failures = link_failures + 1
       WHERE id IN (${dead.map((l) => uuid(l.id)).join(',')});`
    )
  }
  if (toPull.length) {
    statements.push(
      `UPDATE listings SET status = 'rejected'
       WHERE id IN (${toPull.map((l) => uuid(l.id)).join(',')});`
    )
  }

  if (statements.length === 0) {
    log('nothing to write')
    return
  }

  await sql(statements.join('\n'))
  log(`wrote: ${alive.length} verified, ${dead.length} failed, ${toPull.length} unpublished`)

  // Non-zero exit so a scheduled run surfaces in launchd logs as needing a
  // human look, rather than succeeding quietly while listings disappear.
  if (toPull.length) process.exitCode = 1
}

// ------------------------------------------------------------------ main ----

const COMMANDS = { discover, 'check-links': checkLinks, verify }

if (!COMMANDS[cmd]) {
  console.error('usage: curate.mjs <discover|check-links> [options]')
  process.exit(2)
}

COMMANDS[cmd]().catch((err) => {
  console.error('[curate] FAILED:', err.message)
  process.exit(1)
})
