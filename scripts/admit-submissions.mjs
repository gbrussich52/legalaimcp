// PUBLIC. Claude Opus 5.5, 2026-11-22: thin CLI for admitting reviewed submissions as new listings.
// Logic and tests live in scripts/catalog-admit.mjs and lib/catalog-admit.test.ts. This file never talks to the
// database or sends mail: it checks, writes review records, and writes SQL files the owner applies.
// Usage:
//   node scripts/admit-submissions.mjs PLAN.json [--no-fetch]          check only
//   node scripts/admit-submissions.mjs PLAN.json --write-records       merge records into lib/catalog-reviews.json
//   node scripts/admit-submissions.mjs PLAN.json --sql OUT_DIR         write guard/apply/rollback/readback SQL
//   node scripts/admit-submissions.mjs PLAN.json --verify-readback READBACK.json
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadCatalogGate } from './import-reviewed-catalog.mjs'
import { checkPlan, formatResults, buildSQL, mergeRecords, verifyReadback } from './catalog-admit.mjs'

const ROOT = resolve(import.meta.dirname, '..')
const REVIEWS = resolve(ROOT, 'lib/catalog-reviews.json')
const USAGE = 'Usage: node scripts/admit-submissions.mjs PLAN.json [--no-fetch] [--write-records] [--sql OUT_DIR] [--verify-readback READBACK.json]'

const atomicWrite = async (file, text) => { const temp = `${file}.${process.pid}.tmp`; await writeFile(temp, text); await rename(temp, file) }

async function main() {
  const argv = process.argv.slice(2)
  const valueOf = (flag) => { const i = argv.indexOf(flag); if (i === -1) return null; const v = argv[i + 1]; if (!v || v.startsWith('--')) throw Error(`${flag} needs a path. ${USAGE}`); return v }
  const sqlDir = valueOf('--sql'), readbackFile = valueOf('--verify-readback')
  const flags = new Set(['--no-fetch', '--write-records', '--sql', '--verify-readback'])
  const positional = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--sql' && argv[i - 1] !== '--verify-readback')
  const unknown = argv.filter((a) => a.startsWith('--') && !flags.has(a))
  if (positional.length !== 1 || unknown.length) throw Error(USAGE)
  const noFetch = argv.includes('--no-fetch'), writeRecords = argv.includes('--write-records')
  if (noFetch && (writeRecords || sqlDir)) throw Error('--write-records and --sql need a full check with sources fetched; drop --no-fetch')

  const plan = JSON.parse(await readFile(resolve(positional[0]), 'utf8'))
  const gate = await loadCatalogGate()
  const reviewsText = await readFile(REVIEWS, 'utf8')
  const policy = JSON.parse(reviewsText)

  if (readbackFile) {
    // Fingerprints come from the plan's claims; no source fetch is needed to compare a stored row.
    const checked = await checkPlan(plan, { gate, policy, fetchSources: false })
    for (const line of formatResults(checked)) console.log(line)
    if (!checked.ok) { process.exitCode = 1; return }
    const result = verifyReadback(checked, JSON.parse(await readFile(resolve(readbackFile), 'utf8')), gate)
    for (const p of result.problems) console.log(`FAIL readback ${p}`)
    for (const a of checked.admits) if (!a.recorded) console.log(`WARN ${a.slug}: no record in lib/catalog-reviews.json yet; run --write-records before the PR`)
    console.log(result.ok ? `PASS readback: ${checked.admits.length} listings and ${checked.admits.reduce((n, a) => n + a.submission_ids.length, 0) + checked.rejects.reduce((n, r) => n + r.submission_ids.length, 0)} submissions as expected` : 'FAIL readback')
    if (!result.ok) process.exitCode = 1
    return
  }

  const checked = await checkPlan(plan, { gate, policy, fetchSources: !noFetch })
  for (const line of formatResults(checked)) console.log(line)
  if (!checked.ok) { process.exitCode = 1; return }

  if (writeRecords) {
    const fresh = checked.admits.filter((a) => !a.recorded).map((a) => a.record)
    for (const a of checked.admits.filter((x) => x.recorded)) console.log(`SKIP ${a.slug}: identical record already checked in`)
    if (fresh.length) { await atomicWrite(REVIEWS, mergeRecords(reviewsText, fresh)); console.log(`Wrote ${fresh.length} review records to lib/catalog-reviews.json`) }
  }
  if (sqlDir) {
    const sql = buildSQL(checked)
    const out = resolve(sqlDir)
    await mkdir(out, { recursive: true })
    for (const [name, text] of [['guard.sql', sql.guard], ['apply.sql', sql.apply], ['apply.rollback.sql', sql.rollback], ['readback.sql', sql.readback]]) {
      // Pure ASCII on disk: the jsonb literal carries any other character as a \uXXXX escape.
      if (!/^[\x09\x0a\x0d\x20-\x7e]*$/.test(text)) throw Error(`${name} is not ASCII; nothing more written`)
      await atomicWrite(join(out, name), text)
    }
    console.log(`Wrote guard.sql, apply.sql, apply.rollback.sql, readback.sql to ${out}. The owner runs guard.sql first; apply only if every boolean is true.`)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch((e) => { console.error(e.message); process.exitCode = 1 })
