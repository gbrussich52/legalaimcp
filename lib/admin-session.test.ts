import { describe, it, expect } from 'vitest'
import { createSessionToken, verifySessionToken, SESSION_TTL_SECONDS } from './admin-session'

const PW = 'correct-horse-battery'

describe('admin session tokens', () => {
  it('round-trips a freshly minted token', () => {
    const token = createSessionToken(PW)
    expect(verifySessionToken(token, PW)).toBe(true)
  })

  it('has the expected shape and a unique nonce per mint', () => {
    const a = createSessionToken(PW)
    const b = createSessionToken(PW)
    expect(a).toMatch(/^\d+\.[0-9a-f]{32}\.[0-9a-f]{64}$/)
    expect(a).not.toBe(b)
  })

  it('rejects the legacy fixed value and other guessable strings', () => {
    for (const forged of ['authenticated', 'true', 'admin', '1', '', 'a.b.c', '9999999999.x.y']) {
      expect(verifySessionToken(forged, PW)).toBe(false)
    }
  })

  it('rejects a token whose signature was tampered with', () => {
    const token = createSessionToken(PW)
    const flipped = token.slice(0, -1) + (token.endsWith('0') ? '1' : '0')
    expect(verifySessionToken(flipped, PW)).toBe(false)
  })

  it('rejects a token whose expiry was pushed out without re-signing', () => {
    const [exp, nonce, sig] = createSessionToken(PW).split('.')
    const extended = `${Number(exp) + 3600}.${nonce}.${sig}`
    expect(verifySessionToken(extended, PW)).toBe(false)
  })

  it('rejects a token signed with a different password (rotation revokes sessions)', () => {
    const token = createSessionToken('old-password-value')
    expect(verifySessionToken(token, PW)).toBe(false)
  })

  it('rejects an expired token', () => {
    const minted = Date.now() - (SESSION_TTL_SECONDS + 1) * 1000
    const token = createSessionToken(PW, minted)
    expect(verifySessionToken(token, PW)).toBe(false)
    expect(verifySessionToken(token, PW, minted + 1000)).toBe(true)
  })

  it('fails closed when the password is not configured', () => {
    const token = createSessionToken(PW)
    expect(verifySessionToken(token, undefined)).toBe(false)
    expect(verifySessionToken(token, '')).toBe(false)
    expect(verifySessionToken(undefined, PW)).toBe(false)
  })
})
