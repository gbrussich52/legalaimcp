import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminClient } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/constants'
import { intentFormSchema } from '@/lib/featured-intent'
import { recordFunnelEvent } from '@/lib/funnel'
import { rateLimit } from '@/lib/rate-limit'
import {
  FEATURED_PRICE_CENTS,
  getStripe,
  getStripePriceFeatured30d,
  isStripeConfigured,
} from '@/lib/stripe'

export const runtime = 'nodejs'

// Claude Fable 5.2 (executor), 2026-11-15: the body now needs a work email and role (prior code took only listing_id/slug) so every checkout start leaves a contact before the Stripe redirect. `website` is a honeypot: humans never see it.
const bodySchema = intentFormSchema.and(z.object({ website: z.string().optional() }))

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY (and STRIPE_PRICE_FEATURED_30D) in the environment.' },
      { status: 503 },
    )
  }

  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe unavailable' }, { status: 503 })
  }

  const priceId = getStripePriceFeatured30d()
  if (!priceId) {
    return NextResponse.json(
      { error: 'STRIPE_PRICE_FEATURED_30D is not set. Create a $69 Price in Stripe and add the id to env.' },
      { status: 503 },
    )
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Claude Fable 5.2 (executor), 2026-11-15: abuse limits. 5 starts per 10 minutes per client; a filled honeypot is refused without any write.
  if (!rateLimit('featured-checkout', req, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Please try again in a few minutes.' }, { status: 429 })
  }
  if (typeof json === 'object' && json !== null && (json as { website?: unknown }).website) {
    return NextResponse.json({ error: 'Unable to accept this submission.' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'A valid work email and role are required', issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 400 },
    )
  }

  let listing: { id: string; slug: string; name: string; status: string } | null = null
  try {
    const db = getAdminClient()
    let query = db.from('listings').select('id, slug, name, status')
    if (parsed.data.listing_id) {
      query = query.eq('id', parsed.data.listing_id)
    } else {
      query = query.eq('slug', parsed.data.slug as string)
    }
    const { data, error } = await query.maybeSingle()
    if (error) {
      console.error('[stripe/checkout] listing lookup failed', error.message)
      return NextResponse.json({ error: 'Failed to look up listing' }, { status: 500 })
    }
    listing = data
  } catch (err) {
    console.error('[stripe/checkout] admin client unavailable', err)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }
  if (listing.status !== 'published') {
    return NextResponse.json(
      { error: 'Only published listings can purchase Featured' },
      { status: 400 },
    )
  }

  // Checkout returns to this product, never to a caller-supplied Origin.
  const origin = SITE_URL

  // Claude Fable 5.2 (executor), 2026-11-15: record the intent before Stripe so a buyer who leaves is still a contact. If this insert fails we log and continue: a lost lead is cheaper than a lost $69 sale.
  let intentId: string | null = null
  try {
    const { data: intent, error: intentError } = await getAdminClient().from('featured_intents').insert({
      listing_id: listing.id,
      slug: listing.slug,
      email: parsed.data.email,
      role: parsed.data.role,
      status: 'started',
    }).select('id').single()
    if (intentError || !intent) console.error('[stripe/checkout] intent insert failed', intentError?.message)
    else intentId = (intent as { id: string }).id
  } catch (err) {
    console.error('[stripe/checkout] intent insert threw', err instanceof Error ? err.message : 'unknown')
  }
  await recordFunnelEvent('featured_intent_submitted', listing.slug, { role: parsed.data.role })

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/featured/success?session_id={CHECKOUT_SESSION_ID}&slug=${encodeURIComponent(listing.slug)}`,
      // Claude Fable 5.2 (executor), 2026-11-15: the cancel page needs the intent id to store the reason; the page trusts it only to write one enum on a non-paid row.
      cancel_url: `${origin}/featured/cancel?slug=${encodeURIComponent(listing.slug)}${intentId ? `&intent=${intentId}` : ''}`,
      // Claude Fable 5.2 (executor), 2026-11-15: prefill the email, tie the session to the intent, and have Stripe mint a recovery link if it expires.
      customer_email: parsed.data.email,
      ...(intentId ? { client_reference_id: intentId } : {}),
      after_expiration: { recovery: { enabled: true } },
      metadata: {
        ...(intentId ? { intent_id: intentId } : {}),
        listing_id: listing.id,
        slug: listing.slug,
        product: 'featured_30d',
        amount_cents: String(FEATURED_PRICE_CENTS),
      },
      // Keep amount visible in session for webhook audit even if Price changes later.
      payment_intent_data: {
        metadata: {
          listing_id: listing.id,
          slug: listing.slug,
          product: 'featured_30d',
        },
      },
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Checkout session missing URL' }, { status: 500 })
    }

    // Claude Fable 5.2 (executor), 2026-11-15: link the session to its intent; a failure here must not stop the buyer.
    if (intentId) {
      try {
        const { error } = await getAdminClient().from('featured_intents').update({ stripe_session_id: session.id }).eq('id', intentId)
        if (error) console.error('[stripe/checkout] intent session link failed', error.message)
      } catch (err) {
        console.error('[stripe/checkout] intent session link threw', err instanceof Error ? err.message : 'unknown')
      }
    }
    await recordFunnelEvent('featured_stripe_redirect', listing.slug)

    return NextResponse.json({ url: session.url, session_id: session.id })
  } catch (err) {
    console.error('[stripe/checkout] session create failed', err)
    return NextResponse.json({ error: 'Failed to create Checkout Session' }, { status: 502 })
  }
}
