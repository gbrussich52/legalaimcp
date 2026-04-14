'use server'

import { cookies } from 'next/headers'

const ADMIN_COOKIE = 'legalaimcp-admin'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

/**
 * Validate the admin password and set a session cookie.
 * Password is stored in ADMIN_PASSWORD env var.
 */
export async function adminLogin(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  if (password !== expected) return false

  const jar = await cookies()
  jar.set(ADMIN_COOKIE, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/admin',
  })
  return true
}

/**
 * Check if the current request has a valid admin session.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies()
  return jar.get(ADMIN_COOKIE)?.value === 'authenticated'
}

/**
 * Clear the admin session cookie.
 */
export async function adminLogout(): Promise<void> {
  const jar = await cookies()
  jar.delete(ADMIN_COOKIE)
}
