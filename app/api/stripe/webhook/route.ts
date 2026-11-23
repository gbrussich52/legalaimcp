import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getAdminClient } from '@/lib/supabase-admin'
import { FEATURED_PRICE_CENTS, getStripe, isStripeConfigured } from '@/lib/stripe'
import { FEATURED_DURATION_DAYS } from '@/lib/featured-pricing'

export const runtime = 'nodejs'

/** Disable body parsing so we can verify the raw signature. */
export const dynamic = 'force-dynamic'



export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !webhookSecret || webhookSecret.includes('placeholder')) {
    return NextResponse.json({ error: 'Webhook secret missing' }, { status: 503 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // completed fires for every finished Checkout, including delayed-payment
  // methods that have not settled yet; async_payment_succeeded fires when those
  // settle. applyFeaturedPurchase grants only when payment_status === 'paid'.
  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    const session = event.data.object as Stripe.Checkout.Session
    try {
      await applyFeaturedPurchase(session)
    } catch (err) {
      console.error('[stripe/webhook] applyFeaturedPurchase failed', err)
      return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}

function placementFilter(purchasedAt: string, sessionId: string, now: Date): string {
  const notNewer = ['featured_purchased_at.is.null', `featured_purchased_at.lte.${purchasedAt}`]
  const notEditorial = ['featured.eq.false', 'featured_until.not.is.null']
  // Claude Sonnet 5.5, 2026-11-23: third factor, no ACTIVE term bought by a DIFFERENT payment. A row passes when it
  // has no end date, the end date is past (the expiry cron may not have run), or this very payment bought the term.
  // Claude Sonnet 5.5, 2026-11-23 (follow-up): "same payment" is the Stripe session id stored on the row, not the
  // timestamp. JavaScript reads timestamps to the millisecond and Postgres keeps microseconds, so equal-looking times
  // can be different payments. `now` is the one clock reading taken per event.
  // Still ONE or= value: 2 x 2 x 3 = 12 and() terms, because PostgREST has no NOT over an or.
  const notActiveOther = [
    'featured_until.is.null',
    `featured_until.lte.${now.toISOString()}`,
    `stripe_checkout_session_id.eq.${sessionId}`,
  ]
  return notNewer
    .flatMap((a) => notEditorial.flatMap((b) => notActiveOther.map((c) => `and(${a},${b},${c})`)))
    .join(',')
}

// Claude Sonnet 5.5, 2026-11-23: listing_payments.status is free TEXT (migration 007, no check constraint), so a new
// value needs no migration. 'no_placement' = paid, deliberately not placed (editorial pick or an active term).
const NO_PLACEMENT = 'no_placement'

async function markNoPlacement(db: ReturnType<typeof getAdminClient>, sessionId: string) {
  const { error } = await db.from('listing_payments').update({ status: NO_PLACEMENT }).eq('stripe_session_id', sessionId)
  // Do not throw: a retry would log PAID_NO_PLACEMENT a second time. The cost of a failed write is that a later
  // resend may place the listing, so say so in the log.
  if (error) console.error(`NO_PLACEMENT_STATUS_NOT_SAVED session=${sessionId}`)
}

async function applyFeaturedPurchase(session: Stripe.Checkout.Session) {
  if (session.payment_status !== 'paid') {
    console.warn('[stripe/webhook] session not paid, not granting featured', session.id, session.payment_status)
    return
  }

  const listingId = session.metadata?.listing_id
  const slug = session.metadata?.slug
  if (!listingId) {
    console.warn('[stripe/webhook] checkout.session.completed missing listing_id metadata', session.id)
    return
  }

  // Claude Sonnet 5.5, 2026-11-23: the session id goes into the or= filter string, so a value with a comma or
  // parenthesis could change the filter. Stripe ids are letters, digits and underscores.
  if (!/^[A-Za-z0-9_]+$/.test(session.id)) throw new Error('Unexpected session id')
  // Claude Sonnet 5.5, 2026-11-23: one clock reading per event, used by the filter and the readback, so a term that
  // ends between the two calls cannot be read differently.
  const now = new Date()

  const db = getAdminClient()

  // A ledger row proves payment was recorded, not that listing fulfillment succeeded.
  const readPayment = () => db.from('listing_payments')
    .select('listing_id,status,created_at').eq('stripe_session_id', session.id).maybeSingle()
  const { data: existing, error: lookupError } = await readPayment()
  if (lookupError) throw new Error('Payment lookup failed')
  let payment = existing

  // Claude Sonnet 5.5, 2026-11-23: a payment already decided "no placement" stays decided. Before, a resend after the
  // other term ended placed it with whatever was left of its own 30 days. Checked before the completed-status test.
  if (payment && payment.listing_id === listingId && payment.status === NO_PLACEMENT) {
    console.info(`[stripe/webhook] Payment already decided no_placement, listing not updated listing=${listingId} session=${session.id}`)
    return
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  const amountCents =
    typeof session.amount_total === 'number' && session.amount_total > 0
      ? session.amount_total
      : FEATURED_PRICE_CENTS
  const currency = (session.currency || 'usd').toLowerCase()

  if (!payment) {
    const { data: inserted, error: payErr } = await db.from('listing_payments').insert({
      listing_id: listingId,
      stripe_session_id: session.id,
      amount_cents: amountCents,
      currency,
      status: 'completed',
    }).select('listing_id,status,created_at').single()
    if (payErr && payErr.code !== '23505') throw new Error('Payment recording failed')
    if (payErr) {
      const { data: winner, error: retryError } = await readPayment()
      if (retryError) throw new Error('Concurrent payment lookup failed')
      payment = winner
    } else payment = inserted
  }
  if (!payment || payment.listing_id !== listingId || payment.status !== 'completed' ||
    !Number.isFinite(Date.parse(payment.created_at))) throw new Error('Invalid payment evidence')
  const purchasedAt = payment.created_at
  const featuredUntil = new Date(Date.parse(purchasedAt) + FEATURED_DURATION_DAYS * 24 * 60 * 60 * 1000)
  const nowMs = now.getTime()

  // Claude Sonnet 5.5, 2026-11-23: an event delivered or replayed after the 30 days would write a past end
  // date onto a plain row. The payment stays recorded; the listing is not touched.
  if (featuredUntil.getTime() <= nowMs) {
    console.info(`[stripe/webhook] Term already over, listing not updated listing=${listingId} session=${session.id}`)
    return
  }

  const { data: updated, error: listErr } = await db
    .from('listings')
    .update({
      featured: featuredUntil.getTime() > nowMs,
      featured_until: featuredUntil.toISOString(),
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      featured_purchased_at: purchasedAt,
    })
    .eq('id', listingId)
    // Claude Sonnet 5.5, 2026-11-23: (not newer than this purchase) AND (not an editorial pick), as ONE or= value.
    // Editorial = featured with no end date; an admin can make a row editorial after checkout started, and a
    // paid write would stamp an end date that the expiry cron removes 30 days later. Two .or() calls would send
    // two or= parameters, and PostgREST's own tests do not cover that. They do cover nesting inside one
    // parameter (AndOrParamsSpec.hs, "can be nested inside the same expression"), so we expand the AND of the
    // two ORs into four and() terms.
    .or(placementFilter(purchasedAt, session.id, now))
    .select('id')
    .maybeSingle()

  if (listErr) {
    throw new Error('Listing fulfillment failed')
  }

  if (!updated) {
    // A newer purchase wins. A missing listing or unreadable state needs a retry.
    const { data: current, error: currentError } = await db.from('listings')
      .select('featured,featured_until,featured_purchased_at,stripe_checkout_session_id').eq('id', listingId).maybeSingle()
    // Claude Sonnet 5.5, 2026-11-23: editorial row at payment time. Do not throw (Stripe would retry forever) and do
    // not touch the listing or listing_payments.status. The stable code is for a future alert; no email or name.
    if (!currentError && current && current.featured === true && current.featured_until == null) {
      console.error(`PAID_NO_PLACEMENT session=${session.id} listing=${listingId} reason=editorial_pick`)
      await markNoPlacement(db, session.id)
      return
    }
    // Claude Sonnet 5.5, 2026-11-23: a different payment holds an active paid term (two tabs, both paid). Before, the
    // later payment restarted the term, and the earlier payment arriving second fell through with no log line.
    // Answer 200 so Stripe does not retry; the stable code is for a future alert.
    // Follow-up: "different payment" is a different Stripe session id, and "active" is read at the same `now`.
    if (!currentError && current && current.featured_until != null &&
      Date.parse(current.featured_until) > nowMs &&
      current.stripe_checkout_session_id !== session.id) {
      console.error(`PAID_NO_PLACEMENT session=${session.id} listing=${listingId} reason=active_term`)
      await markNoPlacement(db, session.id)
      return
    }
    if (currentError || !current || Date.parse(current.featured_purchased_at) < Date.parse(purchasedAt) ||
      !Number.isFinite(Date.parse(current.featured_purchased_at))) throw new Error('Listing fulfillment unconfirmed')
  }

  console.info(
    `[stripe/webhook] Featured applied listing=${listingId} slug=${slug ?? '?'} until=${featuredUntil.toISOString()}`,
  )
}
