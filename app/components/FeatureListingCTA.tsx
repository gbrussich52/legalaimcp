'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FEATURED_PRICE_CENTS } from '@/lib/featured-pricing'
import { FEATURED_ROLES, ROLE_LABELS, type FeaturedRole } from '@/lib/featured-intent'

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
  // Claude Fable 5.2 (executor), 2026-11-15: short form before Stripe (prior code redirected on click with no contact captured).
  const [formOpen, setFormOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<FeaturedRole | ''>('')
  const [website, setWebsite] = useState('') // honeypot, hidden from people

  const paidActive =
    alreadyFeatured &&
    featuredUntil != null &&
    new Date(featuredUntil).getTime() > Date.now()

  function openForm() {
    setFormOpen(true)
    // Claude Fable 5.2 (executor), 2026-11-15: featured_click is the one client-originated funnel step; slug only, failures ignored.
    fetch('/api/featured/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {})
  }

  async function startCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (!role) {
      setError('Choose the option that describes you.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, slug, email, role, website }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        url?: string
        error?: string
      }
      if (!res.ok || !data.url) {
        setError(
          (res.status === 400 ? 'Enter a valid work email and choose a role.' : '') ||
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
        <p className="font-body text-xs text-charcoal/75 mt-1">
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
          <p className="font-body text-xs text-charcoal/75 mt-1">
            Sponsored sort boost + Featured badge. MCP search stays free.{' '}
            <Link href="/pricing" className="text-gold-text hover:underline">
              Details
            </Link>
          </p>
        </div>
        {!formOpen && (
          <button
            type="button"
            onClick={openForm}
            className="btn-primary whitespace-nowrap"
          >
            Feature this listing
          </button>
        )}
      </div>
      {formOpen && (
        <form onSubmit={startCheckout} className="mt-4 space-y-3" noValidate>
          <label className="block">
            <span className="font-sans text-sm font-semibold text-navy">Work email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-body text-sm"
            />
          </label>
          <fieldset>
            <legend className="font-sans text-sm font-semibold text-navy">Your role</legend>
            <div className="mt-1 space-y-1">
              {FEATURED_ROLES.map((r) => (
                <label key={r} className="flex items-center gap-2 font-body text-sm text-charcoal/80">
                  <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} />
                  {ROLE_LABELS[r]}
                </label>
              ))}
            </div>
          </fieldset>
          {/* Honeypot: off-screen, not focusable; bots fill it, people never see it. */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px' }}>
            <label>
              Website
              <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
          </div>
          <p className="font-body text-xs text-charcoal/75">
            We use your email only to send the receipt and to follow up on this purchase.
          </p>
          <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap disabled:opacity-60">
            {loading ? 'Starting checkout…' : `Continue to payment — ${PRICE_LABEL}`}
          </button>
        </form>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-600 font-body" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
