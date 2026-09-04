import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/constants'
import { FEATURED_PRICE_CENTS } from '@/lib/featured-pricing'

export const metadata: Metadata = {
  title: 'Featured Listing Pricing — LegalAIMCP',
  description:
    'Boost a published listing with a 30-day Featured placement. Sort priority and a Featured badge — MCP search stays free.',
  alternates: { canonical: `${SITE_URL}/pricing` },
}

const PRICE_DISPLAY = `$${(FEATURED_PRICE_CENTS / 100).toFixed(0)}`

export default function PricingPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-2">
        Featured placements
      </p>
      <h1 className="font-display text-4xl font-bold text-navy mb-4">
        Get in front of law firms looking for AI tools
      </h1>
      <p className="font-body text-lg text-charcoal/70 leading-relaxed mb-10">
        Listing in the directory is free. Featured is an optional paid bump:
        higher sort on browse pages and a clear Featured / Sponsored badge.
        The public MCP search endpoint stays free for everyone — Featured never
        gates discovery behind a paywall.
      </p>

      <div className="rounded-2xl border border-gold/40 bg-gold/5 p-8 mb-10">
        <p className="font-sans text-sm font-semibold text-gold-text uppercase tracking-wide mb-2">
          30-day Featured bump
        </p>
        <p className="font-display text-5xl font-bold text-navy mb-2">
          {PRICE_DISPLAY}
          <span className="text-lg font-sans font-medium text-charcoal/50 ml-2">
            / 30 days
          </span>
        </p>
        <p className="font-body text-sm text-charcoal/60 mb-6">
          Peer directories often charge ~$99 for a similar 30-day placement.
          We undercut at {PRICE_DISPLAY}.
        </p>
        <ul className="space-y-2 font-body text-charcoal/80 mb-8">
          <li>✓ Sort boost on /servers, category pages, and homepage Featured grid</li>
          <li>✓ Featured badge on the listing (labeled as sponsored)</li>
          <li>✓ Does not affect MCP tool search results ranking beyond the same sort flag</li>
          <li>✓ No affiliate links required; one Checkout payment</li>
        </ul>
        <Link href="/servers" className="btn-primary inline-flex">
          Pick a published listing →
        </Link>
      </div>

      <section className="font-body text-charcoal/70 space-y-4 text-sm leading-relaxed">
        <h2 className="font-display text-xl font-bold text-navy">How it works</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Publish a listing (free submit + admin review).</li>
          <li>
            On the listing page, click <strong>Feature this listing</strong> to
            open Stripe Checkout.
          </li>
          <li>
            After payment, webhook sets <code>featured=true</code> for 30 days.
            An optional cron clears expired bumps.
          </li>
        </ol>
        <p>
          Editorial Featured (admin toggle with no expiry) can still exist for
          hand-picked tools — those are labeled the same way. Paid bumps always
          carry an expiry.
        </p>
        <p>
          <Link href="/submit" className="text-gold-text font-semibold hover:underline">
            Submit a tool
          </Link>{' '}
          if you are not listed yet.
        </p>
      </section>
    </main>
  )
}
