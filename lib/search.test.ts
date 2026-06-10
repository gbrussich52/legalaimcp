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
