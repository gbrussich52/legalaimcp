import Link from 'next/link'
import { CATEGORY_LABELS, PRICING_LABELS } from '@/lib/constants'
import { VerifiedBadge } from './VerifiedBadge'
import type { ListingCardData } from '@/lib/types'

/**
 * One entry in an editorial "best of" roundup (/best/*).
 *
 * Deliberately reuses only real listing fields — tagline, category, pricing,
 * verified status — rather than generating per-tool marketing copy. The
 * directory's own tagline is already vetted editorial content; this
 * component's job is presentation, not invention. See the 2026-07-28
 * integrity cleanup referenced in lib/category-content.ts for why that
 * boundary matters on this site.
 */
export function RoundupItem({
  listing,
  rank,
}: {
  listing: ListingCardData
  /** Numbered rank for the flagship roundup; omitted on category pages, which are alphabetical. */
  rank?: number
}) {
  const categoryLabel = CATEGORY_LABELS[listing.category] ?? listing.category
  const pricingLabel = PRICING_LABELS[listing.pricing_model] ?? listing.pricing_model

  return (
    <li id={listing.slug} className="scroll-mt-24 border border-slate-200 rounded-2xl p-6 bg-white">
      <div className="flex items-start gap-5">
        {rank !== undefined && (
          <span
            aria-hidden="true"
            className="font-display text-3xl font-bold text-gold-text/30 leading-none pt-1 shrink-0 w-10 text-right"
          >
            {rank}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="font-display text-xl font-bold text-navy">
              <Link href={`/servers/${listing.slug}`} className="hover:text-gold-text transition-colors">
                {listing.name}
              </Link>
            </h3>
            <VerifiedBadge verified={listing.verified} verifiedAt={listing.verified_at} />
          </div>

          <p className="font-body text-charcoal/80 leading-relaxed">{listing.tagline}</p>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs bg-slate-100 text-charcoal rounded-full px-2.5 py-1">
              {categoryLabel}
            </span>
            <span className="text-xs bg-amber-50 text-gold-text rounded-full px-2.5 py-1">
              {pricingLabel}
            </span>
          </div>

          <Link
            href={`/servers/${listing.slug}`}
            className="inline-block mt-4 text-sm font-sans font-semibold text-gold-text hover:underline"
          >
            View full listing →
          </Link>
        </div>
      </div>
    </li>
  )
}
