'use server'

import { cookies } from 'next/headers'
import { verifyAdminPassword } from './password'
import { createSessionToken, verifySessionToken, SESSION_TTL_SECONDS } from './admin-session'

const ADMIN_COOKIE = 'legalaimcp-admin'

/**
 * Validate the admin password and set a signed session cookie.
 * Password is stored in ADMIN_PASSWORD env var; the session token is an HMAC
 * keyed from it (see lib/admin-session.ts), so a forged cookie cannot pass.
 */
export async function adminLogin(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  if (!verifyAdminPassword(password, expected)) return false

  const jar = await cookies()
  jar.set(ADMIN_COOKIE, createSessionToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL_SECONDS,
    path: '/admin',
  })
  return true
}

/**
 * Check if the current request carries a validly signed, unexpired admin session.
 * Fails closed when ADMIN_PASSWORD is unset.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies()
  return verifySessionToken(jar.get(ADMIN_COOKIE)?.value, process.env.ADMIN_PASSWORD)
}

/**
 * Clear the admin session cookie.
 */
export async function adminLogout(): Promise<void> {
  const jar = await cookies()
  jar.delete(ADMIN_COOKIE)
}
