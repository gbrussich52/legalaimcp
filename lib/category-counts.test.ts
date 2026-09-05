import { describe, expect, it } from 'vitest'
import { countListingsByCategory } from './category-counts'

describe('homepage category counts', () => {
  it('maps database enum categories to all public category slugs without losing listings', () => {
    const categories = ['document_processing', 'case_management', 'client_communication', 'legal_research', 'billing_time', 'compliance', 'general', 'legal_research']
    const counts = countListingsByCategory(categories.map(category => ({ category })))
    expect(counts).toEqual({ 'document-processing': 1, 'case-management': 1, 'client-communication': 1, 'legal-research': 2, 'billing-time': 1, compliance: 1, general: 1 })
    expect(Object.values(counts).reduce((sum, count) => sum + count, 0)).toBe(categories.length)
  })
  it('does not invent counts when no published listings are available', () => {
    expect(countListingsByCategory([])).toEqual({})
  })
})
