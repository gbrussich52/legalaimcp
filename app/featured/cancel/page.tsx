import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/constants'
import { getAdminClient } from '@/lib/supabase-admin'
import { SLUG_RE } from '@/lib/featured-intent'
import { CancelSurvey } from './CancelSurvey'

export const metadata: Metadata = {
  // Claude Opus, 2026-11-12: the layout template already appends "| LegalAIMCP"; the old title printed the brand twice.
  title: 'Featured Checkout Canceled',
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_URL}/featured/cancel` },
}

export default async function FeaturedCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; intent?: string }>
}) {
  const { slug, intent } = await searchParams
  // Claude Fable 5.2 (executor), 2026-11-15: survey shows only with a well-formed intent id; the listing name for the mailto subject falls back to the slug if the lookup fails.
  const intentOk = Boolean(intent && /^[0-9a-f-]{36}$/i.test(intent))
  let listingName = slug ?? 'a listing'
  if (intentOk && slug && SLUG_RE.test(slug)) {
    try {
      const { data } = await getAdminClient().from('listings').select('name').eq('slug', slug).maybeSingle()
      if (data?.name) listingName = data.name
    } catch { /* keep the slug */ }
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-20 text-center">
      <p className="font-sans text-xs font-bold uppercase tracking-widest text-charcoal/75 mb-2">
        Checkout canceled
      </p>
      <h1 className="font-display text-3xl font-bold text-navy mb-4">
        No charge was made
      </h1>
      <p className="font-body text-charcoal/75 leading-relaxed mb-8">
        You left Stripe Checkout before paying. Your listing is unchanged. You
        can start Featured checkout again anytime from the listing page.
      </p>
      {intentOk && <CancelSurvey intent={intent as string} listingName={listingName} />}
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
