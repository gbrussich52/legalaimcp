import { describe, expect, it } from 'vitest'
import { getSoftwareConnection, SOFTWARE_CONNECTIONS } from './connections'

describe('reviewed software connection evidence', () => {
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
})
