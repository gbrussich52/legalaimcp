import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Featured checkout canceled — LegalAIMCP',
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_URL}/featured/cancel` },
}

export default async function FeaturedCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>
}) {
  const { slug } = await searchParams

  return (
    <main className="max-w-xl mx-auto px-4 py-20 text-center">
      <p className="font-sans text-xs font-bold uppercase tracking-widest text-charcoal/40 mb-2">
        Checkout canceled
      </p>
      <h1 className="font-display text-3xl font-bold text-navy mb-4">
        No charge was made
      </h1>
      <p className="font-body text-charcoal/70 leading-relaxed mb-8">
        You left Stripe Checkout before paying. Your listing is unchanged. You
        can start Featured checkout again anytime from the listing page.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        {slug ? (
          <Link href={`/servers/${slug}`} className="btn-primary">
            Back to listing
          </Link>
        ) : (
          <Link href="/pricing" className="btn-primary">
            See Featured pricing
          </Link>
        )}
        <Link
          href="/pricing"
          className="border border-slate-200 text-navy px-5 py-2.5 rounded-lg font-sans font-semibold hover:bg-slate-50"
        >
          Pricing
        </Link>
      </div>
    </main>
  )
}
