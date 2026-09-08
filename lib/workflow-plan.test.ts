import { describe, expect, it } from 'vitest'
import { estimateCapacity, systemAdvice, WORKFLOWS } from './workflow-plan'

describe('workflow capacity estimates', () => {
  it('calculates capacity, including the remaining review time', () => {
    expect(estimateCapacity(60, 15, 5)).toEqual({ monthlyHours: 10, improved: true })
  })
  it('does not disguise a slower process as savings', () => {
    expect(estimateCapacity(60, 5, 15)).toEqual({ monthlyHours: -10, improved: false })
    expect(estimateCapacity(60, 5, 5)?.improved).toBe(false)
  })
  it.each([[NaN, 15, 5], [Infinity, 15, 5], [0, 15, 5], [-1, 15, 5], [1.5, 15, 5], [10001, 15, 5], [60, 0, 5], [60, 15, -1], [60, 1441, 5], [60, 15, 1441]])('rejects invalid input %s/%s/%s', (tasks, before, after) => {
    expect(estimateCapacity(tasks, before, after)).toBeNull()
  })
  it('supports zero remaining work and fractional minutes', () => {
    expect(estimateCapacity(120, 0.5, 0)).toEqual({ monthlyHours: 1, improved: true })
  })
  it('keeps compatibility uncertainty explicit', () => {
    expect(systemAdvice('Clio')).toContain('does not confirm MCP compatibility')
    expect(systemAdvice('Other / not sure')).toContain('Inventory your current software')
  })
  it('requires human review and fictional acceptance cases for every offered workflow', () => {
    for (const workflow of Object.values(WORKFLOWS)) {
      expect(workflow.acceptance).toContain('fictional')
      expect(workflow.boundary.length).toBeGreaterThan(50)
      expect(workflow.steps.join(' ')).toMatch(/approv|review/)
    }
  })
})
