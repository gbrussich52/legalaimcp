import type { Metadata } from 'next'
import Link from 'next/link'
import { OrganizationJsonLd } from '../components/JsonLd'
import { NYCLAW_URL, NYCLAW_CALENDLY } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'About LegalAIMCP',
  description:
    'LegalAIMCP is the curated directory of AI-powered integrations for law firms. Built by NYClaw.io, the AI implementation agency serving Westchester County and NYC.',
  alternates: { canonical: 'https://legalaimcp.com/about' },
}

export default function AboutPage() {
  return (
    <main className="section-padding">
      <OrganizationJsonLd />

      <div className="max-w-content mx-auto">
        <h1 className="font-display text-4xl font-bold text-navy">
          About LegalAIMCP
        </h1>

        <div className="space-y-6 mt-8 font-body text-charcoal/80 leading-relaxed">
          <p>
            LegalAIMCP is the first curated directory of AI integrations built
            specifically for the legal industry. We catalog MCP servers — the
            universal adapters that let AI assistants connect directly to the
            tools law firms already use.
          </p>

          <p>
            The legal profession is at an inflection point. AI is no longer
            experimental — firms are using it for contract review, case
            research, client intake, and billing. But finding the right tools
            is hard. Most AI directories are built for developers, not lawyers.
            LegalAIMCP bridges that gap.
          </p>

          <p>
            New submissions are reviewed before they go live, and every
            published link is re-checked automatically so dead tools get
            pulled rather than quietly rotting. We describe tools in plain
            English, not jargon. We show you what each tool does, what it
            costs, and how it connects to your existing systems.
          </p>

          <h2 id="verified" className="font-display text-2xl font-bold text-navy scroll-mt-24">
            What &ldquo;Verified&rdquo; means here
          </h2>

          <p>
            It means one specific, checkable thing:{' '}
            <strong className="text-navy">
              on the date shown, an automated check confirmed every link on
              that listing resolved
            </strong>
            . Nothing more. The check runs on a schedule, not once at launch,
            and a listing that stops responding loses the badge on the next run
            and is removed entirely after three consecutive failures.
          </p>

          <p>
            It is deliberately <em>not</em> an endorsement, a security audit, or
            legal or bar-compliance advice — those are judgments we&apos;re not
            positioned to make, and a badge that quietly implies them is worth
            less than no badge at all. Tools without the badge aren&apos;t
            suspect; they&apos;re usually just behind bot protection that blocks
            automated checks, which we treat as unknown rather than bad.
          </p>

          <p>
            LegalAIMCP is built and maintained by{' '}
            <a
              href={NYCLAW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-text font-semibold hover:underline"
            >
              NYClaw.io
            </a>{' '}
            — an AI implementation agency specializing in automation for law
            firms and small businesses in Westchester County, NY and NYC.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-white rounded-xl p-8 border border-slate-200">
          <h2 className="font-display text-2xl font-bold text-navy">
            Need a custom AI integration for your firm?
          </h2>
          <p className="font-body text-charcoal/80 leading-relaxed mt-3">
            We build private MCP servers tailored to your practice area and
            existing tools.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4 items-start">
            <a
              href={NYCLAW_CALENDLY}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Book a Free Consultation →
            </a>
            <Link
              href="/servers"
              className="font-sans font-semibold text-gold-text hover:underline self-center"
            >
              Browse Available Tools →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
