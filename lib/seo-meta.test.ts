// Claude Sonnet 5.5, 2026-11-12: guard title and description length rules.
import { describe, expect, it } from 'vitest'
import { fitTitle, fitDescription, FILLER, TITLE_MAX, DESC_MIN, DESC_MAX } from './seo-meta'

describe('fitTitle', () => {
  it('keeps short titles for the layout template', () => {
    expect(fitTitle('Pricing')).toBe('Pricing')
  })
  it('drops the brand suffix when the base fits alone', () => {
    const t = 'Best AI Client Intake & Communication Tools for Law Firms'
    expect(fitTitle(t)).toEqual({ absolute: t })
  })
  it('cuts a title that is too long even alone', () => {
    const r = fitTitle('A'.repeat(30) + ' ' + 'B'.repeat(40)) as { absolute: string }
    expect(r.absolute.length).toBeLessThanOrEqual(TITLE_MAX)
  })
})

describe('fitDescription', () => {
  it('extends a short description to the minimum', () => {
    const r = fitDescription('General-purpose AI integrations useful across legal practice areas.', FILLER.category)
    expect(r.length).toBeGreaterThanOrEqual(DESC_MIN)
    expect(r.length).toBeLessThanOrEqual(DESC_MAX)
  })
  it('extends the shortest listing tagline', () => {
    const r = fitDescription('Kira.', FILLER.listing)
    expect(r.startsWith('Kira. See')).toBe(true)
  })
  it('cuts a long description at a word boundary', () => {
    const r = fitDescription('word '.repeat(60), FILLER.post)
    expect(r.length).toBeLessThanOrEqual(DESC_MAX)
  })
})
