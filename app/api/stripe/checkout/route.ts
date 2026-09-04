import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminClient } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/constants'
import {
  FEATURED_PRICE_CENTS,
  getStripe,
  getStripePriceFeatured30d,
  isStripeConfigured,
} from '@/lib/stripe'

export const runtime = 'nodejs'

const bodySchema = z
  .object({
    listing_id: z.string().uuid().optional(),
    slug: z.string().min(1).max(200).optional(),
  })
  .refine((b) => Boolean(b.listing_id || b.slug), {
    message: 'listing_id or slug is required',
  })

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
      { error: 'STRIPE_PRICE_FEATURED_30D is not set. Create a $79 Price in Stripe and add the id to env.' },
      { status: 503 },
    )
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'listing_id or slug is required', issues: parsed.error.issues },
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

  const origin =
    req.headers.get('origin') ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    SITE_URL

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/featured/success?session_id={CHECKOUT_SESSION_ID}&slug=${encodeURIComponent(listing.slug)}`,
      cancel_url: `${origin}/featured/cancel?slug=${encodeURIComponent(listing.slug)}`,
      metadata: {
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

    return NextResponse.json({ url: session.url, session_id: session.id })
  } catch (err) {
    console.error('[stripe/checkout] session create failed', err)
    return NextResponse.json({ error: 'Failed to create Checkout Session' }, { status: 502 })
  }
}
