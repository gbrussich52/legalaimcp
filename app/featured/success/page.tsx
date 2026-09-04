import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Featured payment received — LegalAIMCP',
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_URL}/featured/success` },
}

export default async function FeaturedSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; session_id?: string }>
}) {
  const params = await searchParams
  const slug = params.slug

  return (
    <main className="max-w-xl mx-auto px-4 py-20 text-center">
      <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-2">
        Payment received
      </p>
      <h1 className="font-display text-3xl font-bold text-navy mb-4">
        Your Featured bump is on the way
      </h1>
      <p className="font-body text-charcoal/70 leading-relaxed mb-8">
        Stripe Checkout completed successfully. The Featured badge and sort
        boost usually appear within a minute after the webhook lands. If nothing
        changes after a few minutes, email support with your session id.
      </p>
      {params.session_id && (
        <p className="font-mono text-xs text-charcoal/40 mb-8 break-all">
          Session: {params.session_id}
        </p>
      )}
      <div className="flex flex-wrap gap-3 justify-center">
        {slug ? (
          <Link href={`/servers/${slug}`} className="btn-primary">
            Back to listing
          </Link>
        ) : null}
        <Link
          href="/servers"
          className="border border-slate-200 text-navy px-5 py-2.5 rounded-lg font-sans font-semibold hover:bg-slate-50"
        >
          Browse tools
        </Link>
      </div>
    </main>
  )
}
