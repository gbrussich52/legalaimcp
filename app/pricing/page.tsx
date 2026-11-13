import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/constants'
import { FEATURED_PRICE_CENTS, FEATURED_DURATION_DAYS } from '@/lib/featured-pricing'
import { FAQJsonLd } from '../components/JsonLd'

export const metadata: Metadata = {
  // Claude Opus, 2026-11-12: the layout template already appends "| LegalAIMCP"; the old title printed the brand twice.
  title: 'Featured Listing Pricing',
  description:
    'Boost a published listing with a 30-day Featured placement. Sort priority and a Featured badge — MCP search stays free.',
  alternates: { canonical: `${SITE_URL}/pricing` },
}

const PRICE_DISPLAY = `$${(FEATURED_PRICE_CENTS / 100).toFixed(0)}`

// Claude Opus, 2026-11-12: FAQ for vendors deciding on a placement, rendered on
// the page and as FAQPage JSON-LD (house SEO standard). Every answer restates
// how the code works today: free review-gated listing, one Checkout payment,
// a fixed run, the Sponsored label, and tie-only effect in MCP search.
const PRICING_FAQS = [
  {
    q: 'Does it cost anything to be listed?',
    a: 'No. Listing is free. Submit your tool and it goes live after review.',
  },
  {
    q: 'What does a Featured placement cost?',
    a: `${PRICE_DISPLAY} for ${FEATURED_DURATION_DAYS} days, paid once through Stripe Checkout. It does not renew on its own.`,
  },
  {
    q: 'How is a paid placement labeled?',
    a: 'Paid placements show a Sponsored badge and have an end date. Editorial picks show Featured. Neither label is an endorsement.',
  },
  {
    q: 'Does Featured change MCP search results?',
    a: 'Only for ties. Search ranks by how well a tool matches the question first. Featured moves a tool up only among equally good matches.',
  },
  {
    q: 'Does Featured guarantee traffic or leads?',
    a: 'No. It changes sort order and adds a badge. It does not guarantee impressions, clicks, leads or sales.',
  },
] as const

export default function PricingPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-2">
        Featured placements
      </p>
      <h1 className="font-display text-4xl font-bold text-navy mb-4">
        Get in front of law firms looking for AI tools
      </h1>
      <p className="font-body text-lg text-charcoal/75 leading-relaxed mb-10">
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
          <span className="text-lg font-sans font-medium text-charcoal/80 ml-2">
            / 30 days
          </span>
        </p>
        <p className="font-body text-sm text-charcoal/75 mb-6">
          One payment. No automatic renewal. Placement does not guarantee
          impressions, clicks, leads, or sales.
        </p>
        <ul className="space-y-2 font-body text-charcoal/80 mb-8">
          <li>✓ Sort boost on /servers, category pages, and homepage Featured grid</li>
          <li>✓ Featured badge on the listing (labeled as sponsored)</li>
          {/* Claude Opus, 2026-11-12: MCP search now ranks by relevance first; Featured only breaks ties. */}
          <li>✓ In MCP directory search, Featured breaks ties between equal matches</li>
          <li>✓ No affiliate links required; one Checkout payment</li>
        </ul>
        <Link href="/servers" className="btn-primary inline-flex">
          Pick a published listing →
        </Link>
      </div>

      <section className="font-body text-charcoal/75 space-y-4 text-sm leading-relaxed">
        <h2 className="font-display text-xl font-bold text-navy">How it works</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Publish a listing (free submit + admin review).</li>
          <li>
            On the listing page, click <strong>Feature this listing</strong> to
            open Stripe Checkout.
          </li>
          <li>
            After payment is confirmed, the placement runs for 30 days.
          </li>
        </ol>
        <p>
          Editorial picks are labeled Featured. Paid placements are labeled
          Sponsored and have an expiry date. Neither label is an endorsement
          of security, legal accuracy, or suitability for your firm.
        </p>
        <p>
          <Link href="/submit" className="text-gold-text font-semibold hover:underline">
            Submit a tool
          </Link>{' '}
          if you are not listed yet.
        </p>
      </section>

      <section className="mt-12" aria-labelledby="pricing-faq">
        <h2 id="pricing-faq" className="font-display text-xl font-bold text-navy mb-4">
          Questions vendors ask
        </h2>
        <dl className="space-y-5 font-body text-sm text-charcoal/80 leading-relaxed">
          {PRICING_FAQS.map(({ q, a }) => (
            <div key={q}>
              <dt className="font-sans font-semibold text-navy">{q}</dt>
              <dd className="mt-1">{a}</dd>
            </div>
          ))}
        </dl>
        <FAQJsonLd faqs={PRICING_FAQS} />
      </section>
    </main>
  )
}
