// Claude Opus 5.5, 2026-11-22: a directory flagged our MCP Registry manifest for a missing repository and icon,
// and its version (1.0.0) had drifted from the route's serverInfo (1.4.0; the route now reports 1.5.0). This keeps all three from regressing.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(__dirname, '..')
const manifest = JSON.parse(readFileSync(resolve(root, 'server.json'), 'utf8'))
const route = readFileSync(resolve(root, 'app/api/mcp/route.ts'), 'utf8')

describe('server.json (MCP Registry manifest)', () => {
  it('reports the same version as the live MCP route', () => {
    const match = route.match(/serverInfo:\s*\{[^}]*version:\s*'([^']+)'/)
    expect(match?.[1]).toBeTruthy()
    expect(manifest.version).toBe(match![1])
  })

  it('names the public source repository', () => {
    expect(manifest.repository).toEqual({ url: 'https://github.com/gbrussich52/legalaimcp', source: 'github' })
  })

  it('lists at least one HTTPS PNG icon on legalaimcp.com with schema-valid sizes', () => {
    expect(Array.isArray(manifest.icons) && manifest.icons.length > 0).toBe(true)
    for (const icon of manifest.icons) {
      const url = new URL(icon.src)
      expect(url.protocol).toBe('https:')
      expect(url.hostname).toBe('legalaimcp.com')
      expect(icon.src.length).toBeLessThanOrEqual(255)
      expect(icon.mimeType).toBe('image/png')
      for (const size of icon.sizes) expect(size).toMatch(/^(\d+x\d+|any)$/)
    }
  })
})
