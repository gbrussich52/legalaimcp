import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/admin-auth', () => ({ adminLogin: vi.fn() }))

import { adminLogin } from '@/lib/admin-auth'
import { POST } from './route'

/**
 * NOTE: the route module keeps its lockout map in module scope, which
 * persists across tests in this file. Every test therefore uses its own
 * unique x-forwarded-for IP so lockout state never bleeds between tests.
 */
function makeRequest(
  body: unknown,
  opts: { ip: string; origin?: string; sfs?: string } = { ip: '203.0.113.1' },
) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    host: 'legalaimcp.com',
    'x-forwarded-for': opts.ip,
  }
  if (opts.origin) headers.origin = opts.origin
  if (opts.sfs) headers['sec-fetch-site'] = opts.sfs

  return new Request('https://legalaimcp.com/admin/api/login', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(adminLogin).mockResolvedValue(false)
})

describe('POST /admin/api/login — input validation', () => {
  it('returns 200 on successful login', async () => {
    vi.mocked(adminLogin).mockResolvedValue(true)
    const res = await POST(makeRequest({ password: 'right' }, { ip: '10.0.0.1' }))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
  })

  it('returns 401 on a wrong password', async () => {
    const res = await POST(makeRequest({ password: 'wrong' }, { ip: '10.0.0.2' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 on malformed JSON', async () => {
    const res = await POST(makeRequest('not-json{{{', { ip: '10.0.0.3' }))
    expect(res.status).toBe(400)
    expect(adminLogin).not.toHaveBeenCalled()
  })

  it('returns 400 when password is missing', async () => {
    const res = await POST(makeRequest({}, { ip: '10.0.0.4' }))
    expect(res.status).toBe(400)
    expect(adminLogin).not.toHaveBeenCalled()
  })

  it('returns 400 when password is not a string (type-confusion payloads)', async () => {
    for (const [i, payload] of [123, true, { $gt: '' }, ['a'], null].entries()) {
      const res = await POST(makeRequest({ password: payload }, { ip: `10.0.1.${i}` }))
      expect(res.status).toBe(400)
    }
    expect(adminLogin).not.toHaveBeenCalled()
  })
})

describe('POST /admin/api/login — lockout behavior', () => {
  it('locks an IP out with 429 + Retry-After after 5 failures', async () => {
    const ip = '10.1.0.1'
    let res: Response = new Response()
    for (let i = 0; i < 5; i++) {
      res = await POST(makeRequest({ password: 'wrong' }, { ip }))
    }
    expect(res.status).toBe(429)
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0)
  })

  it('rejects a locked-out IP before even checking the password', async () => {
    const ip = '10.1.0.2'
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest({ password: 'wrong' }, { ip }))
    }
    const callsBefore = vi.mocked(adminLogin).mock.calls.length

    // Correct password now — must still be rejected while locked out
    vi.mocked(adminLogin).mockResolvedValue(true)
    const res = await POST(makeRequest({ password: 'right' }, { ip }))
    expect(res.status).toBe(429)
    expect(vi.mocked(adminLogin).mock.calls.length).toBe(callsBefore)
  })

  it('tracks lockout per IP — other IPs are unaffected', async () => {
    const lockedIp = '10.1.0.3'
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest({ password: 'wrong' }, { ip: lockedIp }))
    }
    const res = await POST(makeRequest({ password: 'wrong' }, { ip: '10.1.0.99' }))
    expect(res.status).toBe(401)
  })

  it('resets the failure counter on a successful login', async () => {
    const ip = '10.1.0.4'
    for (let i = 0; i < 4; i++) {
      await POST(makeRequest({ password: 'wrong' }, { ip }))
    }
    vi.mocked(adminLogin).mockResolvedValueOnce(true)
    const ok = await POST(makeRequest({ password: 'right' }, { ip }))
    expect(ok.status).toBe(200)

    // Counter reset — the next failure is failure #1, not #5
    const res = await POST(makeRequest({ password: 'wrong' }, { ip }))
    expect(res.status).toBe(401)
  })
})

describe('POST /admin/api/login — CSRF same-origin enforcement', () => {
  it('rejects cross-origin requests with 403 before any auth work', async () => {
    vi.mocked(adminLogin).mockResolvedValue(true)
    const res = await POST(
      makeRequest({ password: 'right' }, { ip: '10.2.0.1', origin: 'https://evil.com' }),
    )
    expect(res.status).toBe(403)
    expect(adminLogin).not.toHaveBeenCalled()
  })

  it('rejects sec-fetch-site: cross-site with 403', async () => {
    const res = await POST(
      makeRequest({ password: 'x' }, { ip: '10.2.0.2', sfs: 'cross-site' }),
    )
    expect(res.status).toBe(403)
  })

  it('allows a matching Origin header through to auth', async () => {
    vi.mocked(adminLogin).mockResolvedValue(true)
    const res = await POST(
      makeRequest(
        { password: 'right' },
        { ip: '10.2.0.3', origin: 'https://legalaimcp.com', sfs: 'same-origin' },
      ),
    )
    expect(res.status).toBe(200)
  })
})
