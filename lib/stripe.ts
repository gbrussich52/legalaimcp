/**
 * Lazy Stripe client for Featured Listing checkout.
 *
 * Never hard-code secret keys — read STRIPE_SECRET_KEY at call time so the
 * module can be imported in environments where Stripe is not configured yet
 * (local scaffold, preview builds without secrets).
 */

import Stripe from 'stripe'

export { FEATURED_PRICE_CENTS } from '@/lib/featured-pricing'

/** Stripe Price id for the 30-day Featured product (set in Stripe Dashboard). */
export function getStripePriceFeatured30d(): string {
  return process.env.STRIPE_PRICE_FEATURED_30D ?? ''
}

let stripeClient: Stripe | null = null

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY
  return Boolean(key && key !== 'undefined' && !key.includes('placeholder'))
}

/**
 * Returns a Stripe client, or null when STRIPE_SECRET_KEY is missing.
 * Callers that require payment should 503 when this returns null.
 */
export function getStripe(): Stripe | null {
  if (!isStripeConfigured()) return null
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2026-08-26.dahlia',
      typescript: true,
    })
  }
  return stripeClient
}
