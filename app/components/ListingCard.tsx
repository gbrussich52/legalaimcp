import Link from 'next/link'
import { CATEGORY_LABELS, PRICING_LABELS } from '@/lib/constants'
import { sanitizeLogoUrl } from '@/lib/logo-url'
import { VerifiedBadge } from './VerifiedBadge'
import type { ListingCardData } from '@/lib/types'

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const categoryLabel = CATEGORY_LABELS[listing.category] ?? listing.category
  const pricingLabel = PRICING_LABELS[listing.pricing_model] ?? listing.pricing_model
  // S4: only render https URLs that survive strict parsing — falls back to
  // the initial-letter tile for anything suspicious.
  const logoSrc = sanitizeLogoUrl(listing.logo_url)

  return (
    <Link href={`/servers/${listing.slug}`} className="card group block">
      {/* Header row: logo + text */}
      <div className="flex items-start gap-4">
        {/* Logo or initial-letter fallback */}
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
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
        <VerifiedBadge verified={listing.verified} verifiedAt={listing.verified_at} />
      </div>
    </Link>
  )
}
