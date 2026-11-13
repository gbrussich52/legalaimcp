import { describe, it, expect } from 'vitest'
import { sanitizeSearchQuery } from './search'

describe('sanitizeSearchQuery (PostgREST .or() injection guard)', () => {
  it('passes a normal query through unchanged', () => {
    expect(sanitizeSearchQuery('contract review')).toBe('contract review')
  })
  it('strips PostgREST filter metacharacters ( ) , %', () => {
    expect(sanitizeSearchQuery('x),or(status.eq.pending_review')).toBe('xorstatus.eq.pending_review')
    expect(sanitizeSearchQuery('%wild%card%')).toBe('wildcard')
  })
  it('caps length at 100 chars', () => {
    const long = 'a'.repeat(500)
    expect(sanitizeSearchQuery(long)).toHaveLength(100)
  })
  it('a pure-injection payload reduces to harmless text (cannot reopen the filter)', () => {
    const out = sanitizeSearchQuery('),(or(featured.eq.true),(')
    expect(out).not.toMatch(/[(),%]/)
  })
  it('handles empty string', () => {
    expect(sanitizeSearchQuery('')).toBe('')
  })
})

// Claude Opus, 2026-11-12: guard MCP search relevance. Before this, a DB limit
// ordered by verified/featured cut the true contract tools from a contract query.
import { rankSearchResults, searchTerms, searchScore } from './search'

describe('MCP search relevance ranking', () => {
  const rows = [
    { name: 'Smith.ai', tagline: 'AI and human receptionist options for call handling and intake.', description: 'Staff review calls.', verified: true, verified_at: '2026-10-28', featured: true },
    { name: 'NYClaw Workflow Blueprint', tagline: 'Review one law-firm handoff and identify a practical next step.', description: 'Workflow review.', verified: true, verified_at: '2026-10-28', featured: true },
    { name: 'Concord', tagline: 'AI-assisted contract management, review and lifecycle workflows.', description: 'Contract tool.', verified: false, verified_at: null, featured: false },
    { name: 'Kira by Litera', tagline: 'Machine learning contract analysis.', description: 'Contract review and due diligence.', verified: false, verified_at: null, featured: false },
    { name: 'Billing tool', tagline: 'Invoices.', description: 'Time entries.', verified: true, verified_at: '2026-10-28', featured: true },
  ]
  it('puts rows matching every term ahead of featured or verified rows matching one', () => {
    const out = rankSearchResults(rows, searchTerms('contract review for a small firm'), 3).map((r) => r.name)
    expect(out.slice(0, 2).sort()).toEqual(['Concord', 'Kira by Litera'])
  })
  it('drops rows that match no term', () => {
    expect(rankSearchResults(rows, ['contract'], 10).map((r) => r.name)).not.toContain('Billing tool')
  })
  it('uses verified, then featured, only to break ties', () => {
    const tie = [
      { name: 'B', tagline: 'contract', verified: false, verified_at: null, featured: true },
      { name: 'A', tagline: 'contract', verified: true, verified_at: '2026-10-28', featured: false },
      { name: 'C', tagline: 'contract', verified: false, verified_at: null, featured: false },
    ]
    expect(rankSearchResults(tie, ['contract'], 3).map((r) => r.name)).toEqual(['A', 'B', 'C'])
  })
  it('respects the limit', () => {
    expect(rankSearchResults(rows, ['review'], 2)).toHaveLength(2)
  })
  it('drops stopwords and metacharacters, and falls back for all-stopword queries', () => {
    expect(searchTerms('Best AI tools for (contract) review')).toEqual(['contract', 'review'])
    expect(searchTerms('the')).toEqual(['the'])
    expect(searchTerms('   ')).toEqual([])
  })
  it('ignores the boilerplate review-date note when scoring', () => {
    expect(searchScore({ description: 'Receptionist service. Documentation reviewed on October 27, 2026.' }, ['review'])).toBe(0)
  })
  it('weights a name hit above a description hit', () => {
    expect(searchScore({ name: 'Clio' }, ['clio'])).toBeGreaterThan(searchScore({ description: 'works with clio' }, ['clio']))
  })
})
