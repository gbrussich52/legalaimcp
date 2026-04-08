import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Legal AI Blog',
  description:
    'Articles about AI for law firms — tool reviews, implementation guides, and industry insights from LegalAIMCP.',
  alternates: { canonical: 'https://legalaimcp.com/blog' },
}

export default function BlogPage() {
  return (
    <main className="section-padding">
      <div className="max-w-content mx-auto">
        <h1 className="font-display text-4xl font-bold text-navy">
          Legal AI Blog
        </h1>
        <p className="font-body text-lg text-charcoal/70 mt-3">
          Insights, guides, and tool reviews for law firms navigating AI.
        </p>

        {/* Coming soon */}
        <div className="mt-12 bg-white rounded-xl p-10 border border-slate-200 text-center">
          <h2 className="font-display text-2xl font-bold text-navy">
            Coming Soon
          </h2>
          <p className="font-body text-charcoal/80 leading-relaxed mt-4 max-w-prose mx-auto">
            We&apos;re writing in-depth articles about AI for the legal
            profession. Topics include tool comparisons, implementation guides,
            and compliance considerations.
          </p>
          <p className="font-body text-charcoal/80 leading-relaxed mt-4">
            In the meantime, browse our directory:{' '}
            <Link
              href="/servers"
              className="font-sans font-semibold text-gold-text hover:underline"
            >
              Browse AI Tools →
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
