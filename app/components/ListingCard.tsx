import Link from 'next/link'
import { CATEGORY_LABELS, PRICING_LABELS } from '@/lib/constants'
import type { Listing } from '@/lib/types'

export function ListingCard({ listing }: { listing: Listing }) {
  const categoryLabel = CATEGORY_LABELS[listing.category] ?? listing.category
  const pricingLabel = PRICING_LABELS[listing.pricing_model] ?? listing.pricing_model

  return (
    <Link href={`/servers/${listing.slug}`} className="card group block">
      {/* Header row: logo + text */}
      <div className="flex items-start gap-4">
        {/* Logo or initial-letter fallback */}
        {listing.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.logo_url}
            alt={`${listing.name} logo`}
            className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <span className="text-navy font-sans font-semibold text-lg">
              {listing.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Name + tagline */}
        <div className="min-w-0 flex-1">
          <p className="font-sans font-semibold text-navy group-hover:text-gold-text truncate">
            {listing.name}
          </p>
          <p className="text-sm text-charcoal/60 line-clamp-2 font-body mt-0.5">
            {listing.tagline}
          </p>
        </div>
      </div>

      {/* Bottom row: badges */}
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <span className="text-xs bg-slate-100 text-charcoal rounded-full px-2.5 py-1">
          {categoryLabel}
        </span>
        <span className="text-xs bg-amber-50 text-gold-text rounded-full px-2.5 py-1">
          {pricingLabel}
        </span>
        {listing.verified && (
          <span className="text-xs bg-green-50 text-green-700 rounded-full px-2.5 py-1">
            Verified
          </span>
        )}
      </div>
    </Link>
  )
}
