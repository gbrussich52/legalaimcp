import { NextResponse } from 'next/server'
import { adminLogin } from '@/lib/admin-auth'
import { isSameOriginRequest } from '@/lib/origin'

/**
 * In-memory IP lockout for Wave-1 brute-force protection.
 *
 * Tracks failed login attempts per IP address. After MAX_ATTEMPTS failures
 * within WINDOW_MS, the IP is locked out for LOCKOUT_MS and receives a 429
 * with a Retry-After header. A successful login resets the counter for that IP.
 *
 * WAVE-3 NOTE: This is a single-instance, in-memory stopgap. Distributed
 * brute-force (multiple attacker IPs) and multi-instance Vercel serverless
 * deployments share no state between instances, so this provides meaningful
 * protection only against single-IP serial attempts. Full protection requires
 * either a Vercel Firewall rate-limit rule or a shared KV store (Vercel KV /
 * Upstash Redis) — schedule for Wave 3.
 */

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000 // 15-minute lockout after threshold

interface AttemptRecord {
  count: number
  windowStart: number
  lockedUntil: number | null
}

const attemptMap = new Map<string, AttemptRecord>()

/** Extract the requesting IP from x-forwarded-for, falling back to a shared bucket. */
function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0].trim()
    if (first) return first
  }
  // No IP identifiable — bucket all anonymous requests together so lockout
  // still applies (conservative for serverless where req.ip is unavailable).
  return 'unknown'
}

/** Check whether an IP is currently locked out. Does NOT modify state. */
function isLockedOut(ip: string): { locked: boolean; retryAfterSecs: number } {
  const now = Date.now()
  const record = attemptMap.get(ip)
  if (!record || record.lockedUntil === null) return { locked: false, retryAfterSecs: 0 }
  if (now < record.lockedUntil) {
    return { locked: true, retryAfterSecs: Math.ceil((record.lockedUntil - now) / 1000) }
  }
  return { locked: false, retryAfterSecs: 0 }
}

/** Record a failed attempt. Returns lockout state after recording. */
function recordFailure(ip: string): { blocked: boolean; retryAfterSecs: number } {
  const now = Date.now()
  const record = attemptMap.get(ip)

  if (!record || now - record.windowStart > WINDOW_MS) {
    // No prior record, or window has expired — start fresh
    attemptMap.set(ip, { count: 1, windowStart: now, lockedUntil: null })
    return { blocked: false, retryAfterSecs: 0 }
  }

  record.count += 1

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS
    return { blocked: true, retryAfterSecs: Math.ceil(LOCKOUT_MS / 1000) }
  }

  return { blocked: false, retryAfterSecs: 0 }
}

/** Clear the failure record on a successful login. */
function recordSuccess(ip: string): void {
  attemptMap.delete(ip)
}

export async function POST(request: Request) {
  // CSRF defense: reject cross-origin requests before touching any state.
  if (!isSameOriginRequest(request.headers)) {
    return NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 })
  }

  const ip = getClientIp(request)

  // Reject immediately if the IP is already locked out
  const lockState = isLockedOut(ip)
  if (lockState.locked) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(lockState.retryAfterSecs) },
      },
    )
  }

  let password: string

  try {
    const body = await request.json()
    password = typeof body?.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  const success = await adminLogin(password)

  if (!success) {
    const { blocked, retryAfterSecs } = recordFailure(ip)
    if (blocked) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSecs) },
        },
      )
    }
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  recordSuccess(ip)
  return NextResponse.json({ ok: true })
}
