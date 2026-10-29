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
  it('preserves real handler discovery, structured results and validation under the patched SDK peer', async () => {
    const row = { slug: 'fixture-tool', name: 'Fictional fixture', category: 'legal_research', pricing_model: 'free', verified: false, verified_at: null, description: 'Synthetic public description', secret: 'never-expose-fixture-secret' }
    const chain = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }) }
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain); from.mockReturnValue(chain)
    const rpc = async (method: string, params: Record<string, unknown> = {}) => {
      const response = await POST(request({ jsonrpc: '2.0', id: 19, method, params }))
      expect(response.status).toBe(200)
      const body = await response.text()
      const messages = body.trim().startsWith('{') ? [JSON.parse(body)] : body.split('\n').filter(line => line.startsWith('data: ')).map(line => JSON.parse(line.slice(6)))
      const reply = messages.find(message => message.id === 19)
      expect(reply).toBeDefined()
      return reply
    }
    const listed = await rpc('tools/list')
    expect(listed.result.tools.some((tool: {name:string}) => tool.name === 'get_legal_ai_tool')).toBe(true)
    const result = await rpc('tools/call', { name: 'get_legal_ai_tool', arguments: { slug: row.slug } })
    expect(result.result.isError).not.toBe(true)
    expect(result.result.structuredContent.found).toBe(true)
    expect(result.result.structuredContent.tool.name).toBe(row.name)
    expect(JSON.stringify(result)).not.toContain(row.secret)
    from.mockClear()
    const invalid = await rpc('tools/call', { name: 'get_legal_ai_tool', arguments: { slug: 42 } })
    expect(invalid.result?.isError || invalid.error).toBeTruthy()
    expect(from).not.toHaveBeenCalled()
  })

})
