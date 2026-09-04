'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FEATURED_PRICE_CENTS } from '@/lib/featured-pricing'

const PRICE_LABEL = `$${(FEATURED_PRICE_CENTS / 100).toFixed(0)}`

/**
 * Client CTA: POST listing id/slug to /api/stripe/checkout and redirect to
 * Stripe Checkout. Surfaces a clear error when Stripe env is not configured.
 */
export function FeatureListingCTA({
  listingId,
  slug,
  alreadyFeatured,
  featuredUntil,
}: {
  listingId: string
  slug: string
  alreadyFeatured: boolean
  featuredUntil: string | null
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const paidActive =
    alreadyFeatured &&
    featuredUntil != null &&
    new Date(featuredUntil).getTime() > Date.now()

  async function startCheckout() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, slug }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        url?: string
        error?: string
      }
      if (!res.ok || !data.url) {
        setError(
          data.error ||
            (res.status === 503
              ? 'Featured checkout is not configured yet.'
              : 'Could not start checkout.'),
        )
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error starting checkout.')
    } finally {
      setLoading(false)
    }
  }

  if (paidActive) {
    return (
      <div className="rounded-lg border border-navy/20 bg-navy/5 px-5 py-4 mb-10">
        <p className="font-sans text-sm font-semibold text-navy">
          Featured through {new Date(featuredUntil as string).toLocaleDateString()}
        </p>
        <p className="font-body text-xs text-charcoal/60 mt-1">
          Sponsored placement — sort boost + badge. Renew from this page after it expires.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gold/40 bg-gold/5 px-5 py-4 mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-sans text-sm font-semibold text-navy">
            Feature this listing — {PRICE_LABEL} / 30 days
          </p>
          <p className="font-body text-xs text-charcoal/60 mt-1">
            Sponsored sort boost + Featured badge. MCP search stays free.{' '}
            <Link href="/pricing" className="text-gold-text hover:underline">
              Details
            </Link>
          </p>
        </div>
        <button
          type="button"
          onClick={startCheckout}
          disabled={loading}
          className="btn-primary whitespace-nowrap disabled:opacity-60"
        >
          {loading ? 'Starting checkout…' : 'Feature this listing'}
        </button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-600 font-body" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
