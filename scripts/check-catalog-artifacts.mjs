// classification: PUBLIC
// Replaces manual read-back of the reviewed catalog additions/corrections at build time.
import { readFile, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const load = async file => JSON.parse(await readFile(path.join(root, 'scripts', file), 'utf8'))
const addition = await load('catalog-imanage-work.json')
const correction = await load('catalog-supabase-command-correction.json')
const page = async slug => {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('Unexpected catalog slug')
  return (await readFile(path.join(root, '.next/server/app/servers', `${slug}.html`), 'utf8')).split('</main>')[0]
}
const added = await page(addition.listing.slug)
for (const expected of [addition.listing.name, addition.source_url, addition.reviewed_at, 'Setup has not been tested against a customer account']) {
  if (!added.includes(expected)) throw new Error(`Reviewed catalog page missing expected content: ${addition.listing.slug}`)
}
const corrected = await page(correction.slug)
if (corrected.includes(correction.previous_install_command)) {
  throw new Error(`Unsupported catalog install command remains in generated page: ${correction.slug}`)
}
console.log('Reviewed catalog artifacts PASS: new software/source/date and removed unsupported command')
// A quarantined product must not return via a later build or stale database seed.
const policy = JSON.parse(await readFile(path.join(root, 'lib/catalog-reviews.json'), 'utf8'))
for (const slug of policy.blocked_slugs) {
  const artifact = path.join(root, '.next/server/app/servers', `${slug}.html`)
  let exists = true
  try { await access(artifact) } catch (error) { if (error.code === 'ENOENT') exists = false; else throw error }
  if (exists) throw new Error(`Quarantined product returned to the published catalog: ${slug}`)
}
console.log('Catalog quarantine artifacts PASS')
