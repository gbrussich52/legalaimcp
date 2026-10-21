import { beforeEach, describe, expect, it, vi } from 'vitest'
const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from } }))
import { POST } from './route'

beforeEach(() => from.mockReset())
function request(body: unknown) {
  return new Request('https://legalaimcp.com/api/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify(body),
  })
}
describe('single-message MCP route boundary', () => {
  it('rejects 100 batched tool calls before the SDK can access any catalog rows', async () => {
    const batch = Array.from({ length: 100 }, (_, id) => ({ jsonrpc: '2.0', id, method: 'tools/call', params: { name: 'build_legal_ai_shortlist', arguments: { workflow: 'contracts' } } }))
    expect(new TextEncoder().encode(JSON.stringify(batch)).length).toBeLessThan(32768)
    const response = await POST(request(batch))
    expect(response.status).toBe(400)
    expect(await response.text()).toContain('batches are not supported')
    expect(from).not.toHaveBeenCalled()
  })
  it('rejects excessive nested members before catalog access', async () => {
    const response = await POST(request({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'build_legal_ai_shortlist', arguments: { workflow: 'contracts', extra: Array.from({ length: 300 }, () => 0) } } }))
    expect(response.status).toBe(400)
    expect(from).not.toHaveBeenCalled()
  })
  it('retains ordinary single-message initialize behavior', async () => {
    const response = await POST(request({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'review', version: '1.0.0' } } }))
    expect(response.status).toBe(200)
    expect(await response.text()).toContain('legalaimcp')
    expect(from).not.toHaveBeenCalled()
  })
})
