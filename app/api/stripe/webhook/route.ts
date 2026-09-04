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

  // Idempotent: unique on stripe_session_id — skip if we already recorded this session.
  const { data: existing } = await db
    .from('listing_payments')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle()

  if (existing) {
    return
  }

  const now = new Date()
  const featuredUntil = new Date(now.getTime() + FEATURED_DURATION_DAYS * 24 * 60 * 60 * 1000)
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  const amountCents =
    typeof session.amount_total === 'number' && session.amount_total > 0
      ? session.amount_total
      : FEATURED_PRICE_CENTS
  const currency = (session.currency || 'usd').toLowerCase()

  const { error: payErr } = await db.from('listing_payments').insert({
    listing_id: listingId,
    stripe_session_id: session.id,
    amount_cents: amountCents,
    currency,
    status: 'completed',
  })

  if (payErr) {
    // Unique violation = concurrent duplicate delivery — treat as success.
    if (payErr.code === '23505') return
    throw new Error(`listing_payments insert failed: ${payErr.message}`)
  }

  const { error: listErr } = await db
    .from('listings')
    .update({
      featured: true,
      featured_until: featuredUntil.toISOString(),
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      featured_purchased_at: now.toISOString(),
    })
    .eq('id', listingId)

  if (listErr) {
    throw new Error(`listings featured update failed: ${listErr.message}`)
  }

  console.info(
    `[stripe/webhook] Featured applied listing=${listingId} slug=${slug ?? '?'} until=${featuredUntil.toISOString()}`,
  )
}
