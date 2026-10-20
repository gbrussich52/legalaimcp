import { SITE_URL } from './constants'

export const MCP_MAX_BYTES = 32 * 1024
export const MCP_BODY_TIMEOUT_MS = 5000
export const MCP_MAX_JSON_DEPTH = 12
export const MCP_MAX_JSON_MEMBERS = 256

/** Native MCP clients omit Origin. Browser requests require an exact trusted origin. */
export function trustedMcpOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (origin === null) return true
  const allowed = new Set([SITE_URL, 'https://chatgpt.com', 'https://chat.openai.com'])
  if (process.env.NODE_ENV !== 'production') {
    allowed.add('http://localhost:3000')
    allowed.add('http://localhost:3102')
    allowed.add('http://127.0.0.1:3102')
  }
  return allowed.has(origin)
}

/** Reject batch amplification and excessive structure before SDK traversal. Iterative by design. */
function validateJsonEnvelope(body: Uint8Array): string | null {
  let parsed: unknown
  try { parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body)) }
  catch { return 'Invalid JSON body' }
  if (Array.isArray(parsed)) return 'JSON-RPC batches are not supported; send one message per request'
  if (!parsed || typeof parsed !== 'object') return 'Expected one JSON-RPC object'
  const pending: { value: object; depth: number }[] = [{ value: parsed, depth: 1 }]
  let members = 0
  while (pending.length) {
    const { value, depth } = pending.pop()!
    if (depth > MCP_MAX_JSON_DEPTH) return 'JSON body exceeds nesting limit'
    const values = Object.values(value)
    members += values.length
    if (members > MCP_MAX_JSON_MEMBERS) return 'JSON body exceeds member limit'
    for (const child of values) {
      if (child !== null && typeof child === 'object') pending.push({ value: child, depth: depth + 1 })
    }
  }
  return null
}

/** Bound actual bytes before mcp-handler parses JSON; Content-Length is only an early hint. */
export async function boundedMcpRequest(request: Request): Promise<Request | Response> {
  if (!trustedMcpOrigin(request)) return new Response('Origin not allowed', { status: 403 })
  if (request.method !== 'POST') return request
  const size = request.headers.get('content-length')
  if (size !== null && (!/^\d+$/.test(size) || Number(size) > MCP_MAX_BYTES)) {
    return new Response('Request too large', { status: 413 })
  }
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return new Response('Expected application/json', { status: 415 })
  }
  if (!request.body) return new Response('Expected one JSON-RPC object', { status: 400 })

  const reader = request.body.getReader()
  const parts: Uint8Array[] = []
  let bytes = 0
  let timedOut = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { timedOut = true; reject(new Error('Body deadline')) }, MCP_BODY_TIMEOUT_MS)
  })
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline])
      if (done) break
      bytes += value.byteLength
      if (bytes > MCP_MAX_BYTES) {
        // A hostile stream's cancellation need not settle for us to reject it.
        void reader.cancel().catch(() => {})
        return new Response('Request too large', { status: 413 })
      }
      parts.push(value)
    }
  } catch {
    void reader.cancel().catch(() => {})
    return new Response(timedOut ? 'Request body timed out' : 'Invalid request body', { status: timedOut ? 408 : 400 })
  } finally {
    clearTimeout(timer)
  }
  const body = new Uint8Array(bytes)
  let offset = 0
  for (const part of parts) { body.set(part, offset); offset += part.byteLength }
  const envelopeError = validateJsonEnvelope(body)
  if (envelopeError) return new Response(envelopeError, { status: 400 })
  return new Request(request.url, { method: 'POST', headers: request.headers, body, signal: request.signal })
}
