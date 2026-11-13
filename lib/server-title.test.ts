// Claude Opus, 2026-11-12: guard server page title length.
import { describe, expect, it } from 'vitest'
import { serverPageTitle } from './server-title'

describe('serverPageTitle', () => {
  it('keeps the descriptive suffix for short names', () => {
    expect(serverPageTitle('Harvey MCP (beta)')).toBe('Harvey MCP (beta) — AI Tool for Law Firms')
  })
  it('drops the suffix when the full title would pass 65 chars', () => {
    expect(serverPageTitle('CourtListener Citation Validation MCP (community)')).toBe('CourtListener Citation Validation MCP (community)')
  })
})
