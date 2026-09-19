import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Use | LegalAIMCP',
  description:
    'Terms governing use of the LegalAIMCP directory, workflow planner, and featured-listing purchases. Informational only, not legal advice.',
  alternates: { canonical: 'https://legalaimcp.com/terms' },
}

export default function TermsPage() {
  return (
    <main className="bg-warm-white">
      <section className="max-w-3xl mx-auto px-6 py-20">
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-3">
          Effective September 19, 2026
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy mb-6">Terms of Use</h1>
        <p className="text-lg text-charcoal/75 leading-relaxed mb-14">
          LegalAIMCP is a directory of AI tools and MCP servers for law firms, operated by NYClaw.
          Using the site means you agree to the terms below.
        </p>

        <div className="flex flex-col gap-14">
          <div>
            <h2 className="font-display text-2xl font-semibold text-navy mb-4">Acceptance</h2>
            <p className="text-base text-charcoal/75 leading-relaxed">
              By using LegalAIMCP &mdash; the directory, the workflow planner, the document-check
              demo, or any form on the site &mdash; you agree to these terms. If you don&apos;t
              agree, please don&apos;t use the site.
            </p>
          </div>

          <div className="rounded-lg border border-gold-text/30 bg-gold-text/5 p-8">
            <h2 className="font-display text-2xl font-semibold text-navy mb-4">
              Informational directory, not legal advice
            </h2>
            <p className="text-base text-navy font-medium leading-relaxed">
              LegalAIMCP is operated by engineers, not attorneys. Listings, categories, workflow
              plans, and articles are information about software, not legal advice, and using them
              does not create an attorney-client relationship.
            </p>
            <p className="text-base text-charcoal/75 leading-relaxed mt-4">
              We don&apos;t certify, audit, or guarantee any listed tool&apos;s compliance with bar
              rules, data-security requirements, or a firm&apos;s ethical obligations. Verify any
              tool&apos;s fitness &mdash; including client-confidentiality and ethics questions
              &mdash; against your own state bar&apos;s rules before adopting it.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-navy mb-4">Listings and accuracy</h2>
            <p className="text-base text-charcoal/75 leading-relaxed">
              Listings are submitted by tool creators or compiled from public sources and reviewed
              before publishing, but we don&apos;t independently verify every claim a vendor makes.
              Pricing, features, and availability can change after we last checked &mdash; confirm
              directly with the vendor before you rely on any detail.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-navy mb-4">Featured listings</h2>
            <p className="text-base text-charcoal/75 leading-relaxed">
              Featured placements are paid and always labeled as featured. Payment secures visibility
              for the purchased period; it does not constitute our endorsement of the tool&apos;s
              quality, security, or fitness for any purpose. Purchases are processed by Stripe and
              described further on our{' '}
              <Link className="text-gold-text underline" href="/pricing">pricing</Link> page.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-navy mb-4">
              Workflow planner and document-check demo
            </h2>
            <p className="text-base text-charcoal/75 leading-relaxed">
              These are planning and demonstration tools, not tested integrations or vendor
              endorsements. Estimates they produce are for your own research and stay in your
              browser. Test any real workflow with a person reviewing the output before you rely on
              it with real client or case data.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-navy mb-4">No warranty</h2>
            <p className="text-base text-charcoal/75 leading-relaxed">
              The site is provided &ldquo;as-is,&rdquo; with no warranty of any kind, express or
              implied. We don&apos;t guarantee the site, its listings, or its tools will be
              available, uninterrupted, accurate, or error-free.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-navy mb-4">Limitation of liability</h2>
            <p className="text-base text-charcoal/75 leading-relaxed">
              To the fullest extent permitted by law, LegalAIMCP and NYClaw are not liable for any
              loss or damage arising from your use of the site or reliance on any listing, plan, or
              article it publishes.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-navy mb-4">Acceptable use</h2>
            <p className="text-base text-charcoal/75 leading-relaxed">
              Don&apos;t scrape, bulk-download, or abuse the site or its MCP server in a way that
              degrades the service for others. Don&apos;t misrepresent listings from this site as
              official bar or court records.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-navy mb-4">Governing law</h2>
            <p className="text-base text-charcoal/75 leading-relaxed">
              These terms are governed by the laws of the State of New York, without regard to
              conflict-of-law principles.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-navy mb-4">Contact</h2>
            <p className="text-base text-charcoal/75 leading-relaxed">
              Questions about these terms can be sent through the{' '}
              <Link className="text-gold-text underline" href="/submit">/submit</Link> form.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-navy mb-4">Changes to these terms</h2>
            <p className="text-base text-charcoal/75 leading-relaxed">
              We may update these terms as the product evolves. Continued use of the site after a
              change means you accept the updated terms.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
