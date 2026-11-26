// Claude Opus, 2026-11-12: guard server page title length.
// Claude, 2026-11-26: budget 55 with a shorter suffix tier (Ahrefs 11/26 "Title too long").
import { describe, expect, it } from 'vitest'
import { serverPageTitle, SERVER_TITLE_MAX } from './server-title'
import { fitTitle } from './seo-meta'

const rendered = (t: ReturnType<typeof fitTitle>) => (typeof t === 'string' ? `${t} | LegalAIMCP` : t.absolute)

describe('serverPageTitle', () => {
  it('keeps the descriptive suffix for short names', () => {
    expect(serverPageTitle('Harvey MCP (beta)')).toBe('Harvey MCP (beta) — AI Tool for Law Firms')
  })
  it('uses the short suffix for mid-length names', () => {
    expect(serverPageTitle('DirectCase Legal Search')).toBe('DirectCase Legal Search — Legal AI Tool')
  })
  it('drops the suffix when even the short one would pass the budget', () => {
    expect(serverPageTitle('CourtListener Citation Validation MCP (community)')).toBe('CourtListener Citation Validation MCP (community)')
  })
  it('keeps the brand at the end for names up to 47 characters', () => {
    for (const name of ['Clio Manage', 'DirectCase Legal Search', 'Invoice My Clients MCP', 'CanLII MCP (Vaquill community)']) {
      const title = rendered(fitTitle(serverPageTitle(name)))
      expect(title.endsWith(' | LegalAIMCP'), title).toBe(true)
      expect(title.length).toBeLessThanOrEqual(SERVER_TITLE_MAX + 5)
    }
  })
})
