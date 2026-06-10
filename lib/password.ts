import { timingSafeEqual } from 'crypto'

/**
 * Constant-time admin password comparison using crypto.timingSafeEqual.
 *
 * Lives in its own (non-'use server') module so it can be unit-tested and
 * imported as a plain sync helper — Next.js 'use server' files may only export
 * async functions, so this cannot live in admin-auth.ts.
 *
 * Strategy: if lengths differ we still run timingSafeEqual against a dummy
 * buffer of equal length to the expected password — this prevents the early
 * return from leaking the expected length via timing.
 */
export function verifyAdminPassword(candidate: string, expected: string): boolean {
  const candidateBuf = Buffer.from(candidate, 'utf8')
  const expectedBuf = Buffer.from(expected, 'utf8')

  if (candidateBuf.length !== expectedBuf.length) {
    // Dummy comparison of equal-length buffers so branch timing is
    // indistinguishable from the equal-length path. Result is always false.
    const dummy = Buffer.alloc(expectedBuf.length)
    timingSafeEqual(dummy, expectedBuf)
    return false
  }

  return timingSafeEqual(candidateBuf, expectedBuf)
}
