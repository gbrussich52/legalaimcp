import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getSoftwareConnection, SOFTWARE_CONNECTIONS } from './connections'

describe('reviewed software connection evidence', () => {
  it('keeps the new software record aligned with its evidence and without unearned badges', () => {
    const record = JSON.parse(readFileSync(new URL('../scripts/catalog-imanage-work.json', import.meta.url), 'utf8'))
    const evidence = getSoftwareConnection(record.listing.slug)
    expect(evidence?.source).toBe(record.source_url)
    const registry = JSON.parse(readFileSync(new URL('./catalog-reviews.json', import.meta.url), 'utf8'))
    expect(evidence?.reviewed).toBe(registry.reviews.find((review: { slug: string }) => review.slug === record.listing.slug).reviewed_at)
    expect(record.listing.verified).toBe(false)
    expect(record.listing.verified_at).toBeNull()
    expect(record.listing.featured).toBe(false)
    expect(record.listing.mcp_install_command).toBeNull()
  })
  it('keeps aliases on the same reviewed source instead of conflicting setup paths', () => {
    expect(getSoftwareConnection('harvey-ai')).toBe(getSoftwareConnection('harvey-mcp'))
    expect(getSoftwareConnection('clio')).toBe(getSoftwareConnection('clio-matter-manager'))
    const slugs = SOFTWARE_CONNECTIONS.flatMap(connection => [...connection.slugs])
    expect(new Set(slugs).size).toBe(slugs.length)
  })
  it('does not turn unknown software or object property names into official connectors', () => {
    for (const slug of ['unknown', 'constructor', '__proto__', 'vlex-vincent']) {
      expect(getSoftwareConnection(slug)).toBeUndefined()
    }
    expect(getSoftwareConnection('clio')?.kind).toBe('community')
    expect(getSoftwareConnection('courtlistener-mcp')?.kind).toBe('official')
  })
  it('records primary sources and warns about documented write capabilities', () => {
    for (const connection of SOFTWARE_CONNECTIONS) {
      expect(new URL(connection.source).protocol).toBe('https:')
      expect(connection.reviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(connection.requirements.length).toBeGreaterThan(20)
    }
    expect(getSoftwareConnection('ironclad')?.permissions).toContain('create and update')
    expect(getSoftwareConnection('courtlistener-mcp')?.permissions).toContain('do not assume every tool is read-only')
  })
  // Claude Sonnet 5.5, 2026-11-16: the old CourtListener source (courtlistener-api-client MCP_README.md) went 404
  // after Free Law Project moved the MCP server. Keep the dead URL out and keep the source on an FLP-run host.
  // Claude Sonnet 5.5, 2026-11-17: rebased on main, which (PR #32) moved the source to the courtlistener-mcp README; the pin follows main.
  it('keeps the CourtListener source off the dead 404 URL and on a Free Law Project page', () => {
    const connection = getSoftwareConnection('courtlistener-mcp')
    const urls = [connection?.source, ...(connection?.faqSources ?? []).map(item => item.url)]
    for (const url of urls) {
      expect(url).toBeDefined()
      expect(url).not.toContain('courtlistener-api-client')
      const parsed = new URL(url as string)
      expect(parsed.protocol).toBe('https:')
      expect(['wiki.free.law', 'free.law', 'www.courtlistener.com', 'github.com']).toContain(parsed.hostname)
    }
    expect(connection?.source).toBe('https://github.com/freelawproject/courtlistener-mcp/blob/main/MCP_README.md')
    expect(connection?.reviewed).toBe('2026-11-16')
  })
  // Claude Sonnet 5.5, 2026-11-16: the dead README URL also sat in lib/blog.ts and lib/catalog-reviews.json. Scan
  // lib/ and app/ (not comments, not this file) so it cannot come back. Reads files only; no network.
  it('keeps the dead CourtListener README URL out of lib and app code and data', () => {
    const root = new URL('..', import.meta.url).pathname
    const hits: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name)
        if (statSync(path).isDirectory()) { walk(path); continue }
        if (!/\.(ts|tsx|json)$/.test(name) || path.endsWith('lib/connections.test.ts')) continue
        for (const line of readFileSync(path, 'utf8').split('\n')) {
          if (/^\s*(\/\/|\*|\/\*)/.test(line)) continue
          if (line.includes('courtlistener-api-client/blob/main/MCP_README.md') || line.includes('courtlistener-api-client/main/MCP_README.md')) hits.push(path)
        }
      }
    }
    walk(join(root, 'lib'))
    walk(join(root, 'app'))
    expect(hits).toEqual([])
  })
})
