// PUBLIC. Post-build IndexNow submit for legalaimcp.com.
// Claude, 2026-11-26: runs after `next build` (npm postbuild). Only on Vercel production builds; preview and local
// builds exit at once. Reads the URL list from the live sitemap (the previous deploy's list, which is fine: IndexNow
// only asks engines to recrawl), posts it to api.indexnow.org and logs the status. It never fails the build: every
// error is caught and the script always exits 0. Node built-ins only (global fetch, AbortSignal.timeout).
// Key file: public/1a366e5be29e8a3030dd846be8b6acfa.txt. The manual scripts/indexnow-ping.sh uses the same key.

import { pathToFileURL } from 'node:url'

const HOST = 'legalaimcp.com'
const KEY = '1a366e5be29e8a3030dd846be8b6acfa'
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`
const SITEMAP = `https://${HOST}/sitemap.xml`
const ENDPOINT = 'https://api.indexnow.org/indexnow'
const MAX_URLS = 10000
const TIMEOUT_MS = 8000

/** <loc> values from a sitemap that belong to this host, de-duplicated, capped at 10,000. */
export function urlsFromSitemap(xml, host = HOST) {
  const out = new Set()
  for (const match of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    const loc = match[1].replace(/&amp;/g, '&')
    try {
      if (new URL(loc).hostname === host) out.add(loc)
    } catch {
      // not a URL, skip
    }
    if (out.size >= MAX_URLS) break
  }
  return [...out]
}

async function main() {
  if (process.env.VERCEL_ENV !== 'production') {
    console.log(`IndexNow: skipped (VERCEL_ENV=${process.env.VERCEL_ENV ?? 'unset'}, runs on production builds only)`)
    return
  }
  const sitemap = await fetch(SITEMAP, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!sitemap.ok) {
    console.log(`IndexNow: skipped, sitemap returned ${sitemap.status}`)
    return
  }
  const urlList = urlsFromSitemap(await sitemap.text())
  if (urlList.length === 0) {
    console.log('IndexNow: skipped, sitemap had no URLs for this host')
    return
  }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  console.log(`IndexNow: submitted ${urlList.length} URLs, status ${res.status} ${res.statusText}`)
}

// Run only when executed directly (node scripts/seo/indexnow-submit.mjs), not when a test imports it.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .catch((error) => {
      console.log(`IndexNow: not submitted (${error instanceof Error ? error.message : String(error)}); build continues`)
    })
    .finally(() => process.exit(0))
}
