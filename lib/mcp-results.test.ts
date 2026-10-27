import { describe, it, expect } from 'vitest'
import { ToolItem, toStructured, formatTool } from './mcp-results'

const row = { slug: 'ironclad', name: 'Ironclad', category: 'document_processing', pricing_model: 'paid', verified: false, verified_at: null, secret: 'never-expose', stripe_payment_intent_id: 'private-payment', description: 'Public description' }

describe('MCP connection evidence', () => {
  it('returns documented permissions without claiming account compatibility or passing link checks', () => {
    const result = ToolItem.parse(toStructured(row))
    expect(result.connection).toMatchObject({ type: 'official', customer_account_tested: false, documentation_reviewed_at: '2026-10-27' })
    expect(result.connection?.permissions).toContain('create and update')
    expect(result.links_verified).toBe(false)
    expect(result.links_verified_at).toBeNull()
    expect(formatTool(row, true)).toContain(result.connection!.permissions)
    expect(formatTool(row)).toContain(result.connection!.source_url)
  })
  it('retains null for unknown sources and distinguishes community from official', () => {
    expect(toStructured({ ...row, slug: 'unknown' }).connection).toBeNull()
    expect(toStructured({ ...row, slug: 'constructor' }).connection).toBeNull()
    expect(toStructured({ ...row, slug: 'clio' }).connection?.type).toBe('community')
    expect(toStructured({ ...row, slug: 'imanage-work' }).connection?.type).toBe('official')
  })
  it('cannot serialize arbitrary database fields or a forged customer-account success claim', () => {
    const output = toStructured(row)
    expect(JSON.stringify(output)).not.toContain('never-expose')
    expect(JSON.stringify(output)).not.toContain('private-payment')
    expect(ToolItem.safeParse({ ...output, connection: { ...output.connection, customer_account_tested: true } }).success).toBe(false)
    const inventedRow = { ...row, connection: { source_url: 'https://attacker.invalid' } }
    expect(JSON.stringify(toStructured(inventedRow))).not.toContain('attacker.invalid')
  })
})
