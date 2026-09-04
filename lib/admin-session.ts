import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Stateless, signed admin session tokens.
 *
 * Token = `<expiresAtUnixSeconds>.<nonce>.<hmacSha256Hex>`. The signing key is
 * derived from ADMIN_PASSWORD (the only admin secret this deployment has), so
 * no extra environment variable is needed and rotating the password revokes
 * every outstanding session. A cookie value that is not signed by this key is
 * indistinguishable from garbage — the old fixed string 'authenticated' could
 * be typed into DevTools by anyone.
 */

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

const KEY_CONTEXT = 'legalaimcp-admin-session-v1'
const NONCE_BYTES = 16

function signingKey(adminPassword: string): Buffer {
  return createHmac('sha256', KEY_CONTEXT).update(adminPassword, 'utf8').digest()
}

function sign(payload: string, adminPassword: string): string {
  return createHmac('sha256', signingKey(adminPassword)).update(payload, 'utf8').digest('hex')
}

/** Mint a token that expires SESSION_TTL_SECONDS from `now` (ms epoch). */
export function createSessionToken(adminPassword: string, now: number = Date.now()): string {
  const exp = Math.floor(now / 1000) + SESSION_TTL_SECONDS
  const nonce = randomBytes(NONCE_BYTES).toString('hex')
  const payload = `${exp}.${nonce}`
  return `${payload}.${sign(payload, adminPassword)}`
}

/** True only for a well-formed, unexpired token signed with the current password. */
export function verifySessionToken(
  token: string | undefined,
  adminPassword: string | undefined,
  now: number = Date.now(),
): boolean {
  if (!adminPassword || typeof token !== 'string') return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [expStr, nonce, sig] = parts
  if (!/^\d{1,12}$/.test(expStr)) return false
  if (!/^[0-9a-f]{32}$/.test(nonce)) return false
  if (!/^[0-9a-f]{64}$/.test(sig)) return false

  const expected = sign(`${expStr}.${nonce}`, adminPassword)
  if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return false

  return Number(expStr) > Math.floor(now / 1000)
}
