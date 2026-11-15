// Claude Fable 5.2 (executor), 2026-11-15: the one client-originated funnel step. Accepts only {slug}; writes featured_click; 204 whatever happens to the insert.
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { SLUG_RE } from '@/lib/featured-intent'
import { recordFunnelEvent } from '@/lib/funnel'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const schema = z.object({ slug: z.string().regex(SLUG_RE) }).strict()

export async function POST(req: Request) {
  if (!rateLimit('featured-click', req, 30, 10 * 60 * 1000)) return new NextResponse(null, { status: 429 })
  let json: unknown
  try { json = await req.json() } catch { return new NextResponse(null, { status: 400 }) }
  const parsed = schema.safeParse(json)
  if (!parsed.success) return new NextResponse(null, { status: 400 })
  await recordFunnelEvent('featured_click', parsed.data.slug)
  return new NextResponse(null, { status: 204 })
}
