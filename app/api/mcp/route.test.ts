import { beforeEach, describe, expect, it, vi } from 'vitest'
const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from } }))
import { POST } from './route'
import reviews from '@/lib/catalog-reviews.json'

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

  // Claude Sonnet 5.5, 2026-11-23: independence and the checks travel with the answer, so an agent that never opens
  // the website still sees that LegalAIMCP is not the vendor and how to repeat each check.
  describe('independent-directory evidence', () => {
    const captain = (reviews.reviews as { slug: string; claims: Record<string, unknown> }[]).find(r => r.slug === 'captainlegal')!.claims
    const rpc = async (method: string, params: Record<string, unknown> = {}) => {
      const response = await POST(request({ jsonrpc: '2.0', id: 7, method, params }))
      const body = await response.text()
      const messages = body.trim().startsWith('{') ? [JSON.parse(body)] : body.split('\n').filter(line => line.startsWith('data: ')).map(line => JSON.parse(line.slice(6)))
      return messages.find(message => message.id === 7)
    }
    // Claude Opus 5.5, 2026-11-27: 1.6.0 adds get_ai_disclosure.
    it('reports version 1.6.0 and says the server is a directory, not the vendor', async () => {
      const reply = await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'review', version: '1.0.0' } })
      expect(reply.result.serverInfo.version).toBe('1.6.0')
      expect(reply.result.instructions).toContain('This server is an independent directory, not the vendor of any listed tool. get_legal_ai_tool returns the checks we ran and how to repeat them.')
    })
    it('get_legal_ai_tool returns the full verification object next to source_review', async () => {
      const chain = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: { ...captain, verified: false, verified_at: null }, error: null }) }
      chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain); from.mockReturnValue(chain)
      const { result } = await rpc('tools/call', { name: 'get_legal_ai_tool', arguments: { slug: 'captainlegal' } })
      const tool = result.structuredContent.tool
      expect(tool.verification.independent).toBe(true)
      expect(tool.verification.checks.map((c: { id: string }) => c.id)).toContain('mcp_endpoint')
      expect(tool.verification.method_url).toBe('https://legalaimcp.com/how-we-verify')
      expect(tool.source_review.reviewed_at).toBe('2026-11-22')
      expect(tool.verification_summary).toBeUndefined()
      expect(result.content[0].text).toContain('independent directory')
    })
    it('search_legal_ai_tools returns only the compact summary per item', async () => {
      const chain: Record<string, unknown> = {}
      for (const key of ['select', 'eq', 'order', 'limit']) chain[key] = vi.fn(() => chain)
      chain.then = (resolve: (v: unknown) => void) => resolve({ data: [{ ...captain, verified: false, verified_at: null }], error: null })
      from.mockReturnValue(chain)
      const { result } = await rpc('tools/call', { name: 'search_legal_ai_tools', arguments: {} })
      const item = result.structuredContent.tools[0]
      expect(item.verification_summary).toMatchObject({ independent: true, checked_at: '2026-11-23', full_record_tool: 'get_legal_ai_tool', method_url: 'https://legalaimcp.com/how-we-verify' })
      expect(item.verification).toBeUndefined()
      expect(JSON.stringify(item.verification_summary)).not.toContain('curl')
    })
  })

  // Claude Opus 5.5, 2026-11-27: get_ai_disclosure reads the static registry only, never the database, and says plainly
  // when nothing is published rather than inventing an answer.
  describe('get_ai_disclosure', () => {
    const rpc = async (method: string, params: Record<string, unknown> = {}) => {
      const response = await POST(request({ jsonrpc: '2.0', id: 11, method, params }))
      const body = await response.text()
      const messages = body.trim().startsWith('{') ? [JSON.parse(body)] : body.split('\n').filter(line => line.startsWith('data: ')).map(line => JSON.parse(line.slice(6)))
      return messages.find(message => message.id === 11)
    }
    it('is listed as a read-only tool', async () => {
      const { result } = await rpc('tools/list')
      const tool = result.tools.find((t: { name: string }) => t.name === 'get_ai_disclosure')
      expect(tool).toBeDefined()
      expect(tool.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false, openWorldHint: false })
    })
    it('returns found=false and the standard page for a slug with no disclosure, without touching the database', async () => {
      const { result } = await rpc('tools/call', { name: 'get_ai_disclosure', arguments: { slug: 'no-such-vendor' } })
      expect(result.isError).not.toBe(true)
      expect(result.structuredContent).toEqual({ found: false, standard_url: 'https://legalaimcp.com/ai-disclosure' })
      expect(result.content[0].text).toContain('No AI Disclosure is published')
      expect(from).not.toHaveBeenCalled()
    })
    it('does not treat object prototype names as slugs', async () => {
      const { result } = await rpc('tools/call', { name: 'get_ai_disclosure', arguments: { slug: 'constructor' } })
      expect(result.structuredContent.found).toBe(false)
    })
    it('returns the fictional example with every field, its source and the duties, marked fictional and self-reported', async () => {
      const { result } = await rpc('tools/call', { name: 'get_ai_disclosure', arguments: { slug: 'example-vendor' } })
      const d = result.structuredContent.disclosure
      expect(result.structuredContent.found).toBe(true)
      expect(d.vendor).toBe('Example Vendor, Inc.')
      expect(d.fictional).toBe(true)
      expect(d.status).toBe('self_reported')
      expect(d.reviewed_at).toBeNull()
      expect(d.fields).toHaveLength(15)
      expect(d.not_legal_advice).toBe(true)
      const training = d.fields.find((f: { id: string }) => f.id === 'trains_by_default')
      expect(training.source_url).toBe('https://example.com/terms')
      expect(training.duties).toContain('Informed consent for self-learning tools')
      expect(result.content[0].text).toContain('FICTIONAL EXAMPLE')
      expect(from).not.toHaveBeenCalled()
    })
    it('rejects a malformed slug', async () => {
      const reply = await rpc('tools/call', { name: 'get_ai_disclosure', arguments: { slug: '../etc' } })
      expect(reply.result?.isError || reply.error).toBeTruthy()
    })
  })
})
