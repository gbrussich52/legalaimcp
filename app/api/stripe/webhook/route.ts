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

  const db = getAdminClient()

  // A ledger row proves payment was recorded, not that listing fulfillment succeeded.
  const readPayment = () => db.from('listing_payments')
    .select('listing_id,status,created_at').eq('stripe_session_id', session.id).maybeSingle()
  const { data: existing, error: lookupError } = await readPayment()
  if (lookupError) throw new Error('Payment lookup failed')
  let payment = existing

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

  const { data: updated, error: listErr } = await db
    .from('listings')
    .update({
      featured: featuredUntil.getTime() > Date.now(),
      featured_until: featuredUntil.toISOString(),
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      featured_purchased_at: purchasedAt,
    })
    .eq('id', listingId)
    .or(`featured_purchased_at.is.null,featured_purchased_at.lte.${purchasedAt}`)
    .select('id')
    .maybeSingle()

  if (listErr) {
    throw new Error('Listing fulfillment failed')
  }

  if (!updated) {
    // A newer purchase wins. A missing listing or unreadable state needs a retry.
    const { data: current, error: currentError } = await db.from('listings')
      .select('featured_purchased_at').eq('id', listingId).maybeSingle()
    if (currentError || !current || Date.parse(current.featured_purchased_at) < Date.parse(purchasedAt) ||
      !Number.isFinite(Date.parse(current.featured_purchased_at))) throw new Error('Listing fulfillment unconfirmed')
  }

  console.info(
    `[stripe/webhook] Featured applied listing=${listingId} slug=${slug ?? '?'} until=${featuredUntil.toISOString()}`,
  )
}
