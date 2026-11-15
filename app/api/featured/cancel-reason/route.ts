// Claude Fable 5.2 (executor), 2026-11-15: one-click "What stopped you?" answer. The intent id from the cancel URL is trusted only to write this one enum on a row that is not paid; it is a random uuid and nothing else on the row is returned.
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminClient } from '@/lib/supabase-admin'
import { getStripe } from '@/lib/stripe'
import { CANCEL_REASONS } from '@/lib/featured-intent'
import { recordFunnelEvent } from '@/lib/funnel'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const schema = z.object({ intent: z.string().uuid(), reason: z.enum(CANCEL_REASONS) }).strict()

export async function POST(req: Request) {
  if (!rateLimit('featured-cancel', req, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  let json: unknown
  try { json = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }
  const parsed = schema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const { intent, reason } = parsed.data

  let row: { slug: string | null; stripe_session_id: string | null } | null = null
  try {
    const db = getAdminClient()
    const { data, error } = await db.from('featured_intents')
      .update({ cancel_reason: reason }).eq('id', intent).neq('status', 'paid').select('id, slug, stripe_session_id')
    if (error) console.error('[featured/cancel-reason] write failed', error.message)
    else if (Array.isArray(data) && data[0]) row = data[0]
    // A still-open session means the buyer left: mark it canceled. Only from "started" so expired stays expired.
    if (row) await db.from('featured_intents').update({ status: 'canceled' }).eq('id', intent).eq('status', 'started')
  } catch (err) {
    console.error('[featured/cancel-reason] db unavailable', err instanceof Error ? err.message : 'unknown')
  }

  // Same answer whether the row existed, was paid or was unknown: nothing to probe.
  let paymentUrl: string | null = null
  if (row) {
    await recordFunnelEvent('featured_cancel_reason', row.slug, { reason })
    const stripe = getStripe()
    if (stripe && row.stripe_session_id) {
      try {
        const s = await stripe.checkout.sessions.retrieve(row.stripe_session_id)
        if (s.status === 'open' && s.url) paymentUrl = s.url
      } catch (err) {
        console.error('[featured/cancel-reason] session retrieve failed', err instanceof Error ? err.message : 'unknown')
      }
    }
  }
  return NextResponse.json({ ok: true, payment_url: paymentUrl })
}
