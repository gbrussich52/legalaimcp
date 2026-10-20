import { SITE_URL } from './constants'

export const MCP_MAX_BYTES = 32 * 1024
export const MCP_BODY_TIMEOUT_MS = 5000

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
  if (!request.body) return request

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
  return new Request(request.url, { method: 'POST', headers: request.headers, body, signal: request.signal })
}
