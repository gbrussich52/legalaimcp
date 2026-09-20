import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | LegalAIMCP',
  description:
    'How LegalAIMCP collects and uses information from directory forms, Stripe payments, and cookieless analytics. No accounts, no client data.',
  alternates: { canonical: 'https://legalaimcp.com/privacy' },
}

export default function PrivacyPage() {
  return (
    <main className="bg-warm-white">
      <section className="max-w-3xl mx-auto px-6 py-20">
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-3">
          Effective September 19, 2026
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy mb-6">Privacy Policy</h1>
        <p className="text-lg text-charcoal/75 leading-relaxed mb-14">
          LegalAIMCP is a directory and workflow-planning tool operated by NYClaw. We don&apos;t have
          customer accounts, and we don&apos;t ask for client or case data anywhere on the site. This
          page explains exactly what we collect and why.
        </p>

        <div className="flex flex-col gap-14">
          <div>
            <h2 className="font-display text-2xl font-semibold text-navy mb-4">No accounts</h2>
            <p className="text-base text-charcoal/75 leading-relaxed">
              Browsing the directory, using the free workflow planner, and running the document-check
              demo require no sign-up. The planner and the document-check demo run entirely in your
              browser &mdash; the inputs you type there are never sent to our servers. A separate
              login exists only for the small team that operates the site; it is not a customer
              account system.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-navy mb-4">What we collect, and where</h2>
            <p className="text-base text-charcoal/75 leading-relaxed mb-4">
              We only collect information you type into one of our forms:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-charcoal/75">
              <li>
                <span className="text-navy font-medium">Submit a tool</span> (
                <Link className="text-gold-text underline" href="/submit">/submit</Link>): tool name,
                category, product and repository URLs, pricing, a description, and your name and
                email address so we can follow up on the listing.
              </li>
              <li>
                <span className="text-navy font-medium">Workflow monitoring pilot</span> (
                <Link className="text-gold-text underline" href="/pilot">/pilot</Link>): your
                description of the workflow and fictional test examples, your name, organization, and
                contact email, and &mdash; if you provide one &mdash; the integration endpoint you
                want reviewed.
              </li>
            </ul>
            <p className="text-base text-charcoal/75 leading-relaxed mt-4">
              Both forms ask you to keep examples fictional and free of real client or case data; we
              don&apos;t want it and don&apos;t need it to review a submission or scope a pilot.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-navy mb-4">Payments</h2>
            <p className="text-base text-charcoal/75 leading-relaxed">
              Featured-listing purchases are processed by Stripe. We never see or store your card
              number &mdash; Stripe handles the transaction and tells us only that a listing was paid
              for and for how long.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-navy mb-4">Analytics</h2>
            <p className="text-base text-charcoal/75 leading-relaxed">
              We use Vercel Web Analytics to see aggregate traffic patterns &mdash; which pages get
              visited, roughly how many people, from where. It is cookieless: it doesn&apos;t use
              cookies, doesn&apos;t track you across other sites, and can&apos;t identify you
              individually. We run no other analytics, advertising pixels, or cross-site trackers.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-navy mb-4">How we use it</h2>
            <p className="text-base text-charcoal/75 leading-relaxed">
              Form submissions are used only to review your listing or pilot request and to contact
              you about it. We don&apos;t sell, rent, or share your information with third parties,
              and we don&apos;t send marketing email unless you explicitly asked for it.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-navy mb-4">Requesting deletion</h2>
            <p className="text-base text-charcoal/75 leading-relaxed">
              To have information you submitted removed or corrected, send the details through the{' '}
              <Link className="text-gold-text underline" href="/submit">/submit</Link> form and note
              that it&apos;s a privacy request rather than a new listing, or email{' '}
              <a className="text-gold-text underline" href="mailto:hello@legalaimcp.com">hello@legalaimcp.com</a>.
              We&apos;ll act on it promptly.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-navy mb-4">Changes to this policy</h2>
            <p className="text-base text-charcoal/75 leading-relaxed">
              If how we handle data changes, we&apos;ll update this page and its effective date
              above.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
