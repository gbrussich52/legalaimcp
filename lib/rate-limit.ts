// Claude Fable 5.2 (executor), 2026-11-15: the repo had no shared limiter (only an inline one in the admin login route); small in-memory fixed-window limiter for the new public featured endpoints. Per-instance, same caveat as the admin lockout; the IP is a map key in memory only and is never stored or logged.
const hits = new Map<string, { count: number; windowStart: number }>()

export function clientKey(req: Request): string {
  return req.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || 'unknown'
}

/** True when the request is allowed. */
export function rateLimit(bucket: string, req: Request, max: number, windowMs: number): boolean {
  const key = `${bucket}:${clientKey(req)}`
  const now = Date.now()
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v.windowStart > windowMs) hits.delete(k)
  const rec = hits.get(key)
  if (!rec || now - rec.windowStart > windowMs) { hits.set(key, { count: 1, windowStart: now }); return true }
  rec.count++
  return rec.count <= max
}

export function resetRateLimits() { hits.clear() }
