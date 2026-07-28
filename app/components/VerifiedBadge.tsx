import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

/**
 * The one trust signal on this site that is mechanically earned.
 *
 * `verified` used to be a bare boolean set by hand on well-known brands, which
 * made the green pill a statement about name recognition dressed up as a
 * check. It now means exactly one falsifiable thing — an automated probe
 * confirmed every URL on the listing resolved, on the date shown — and it is
 * written only by scripts/curate.mjs.
 *
 * Two deliberate choices:
 *
 * 1. **The date is not optional.** A trust badge with no timestamp makes a
 *    present-tense claim off potentially ancient evidence, which is how the
 *    previous version ended up vouching for domains that had stopped
 *    resolving. Rendering the date is what keeps the claim honest as it ages,
 *    and it costs a reader nothing to check.
 * 2. **It renders nothing unless both fields are set.** If `verified_at` is
 *    missing the badge disappears rather than degrading to an undated pill —
 *    an unfalsifiable badge is the failure mode, so it should be impossible to
 *    reach, not merely discouraged.
 */

const FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  // Pin the zone: these are server-rendered, and letting the build machine's
  // locale decide would make the same listing show different dates across
  // deploys for no reason.
  timeZone: 'UTC',
}

export function VerifiedBadge({
  verified,
  verifiedAt,
  showDate = false,
}: {
  verified: boolean
  verifiedAt: string | null
  /** Detail pages spell the date out; dense card grids keep it in the tooltip. */
  showDate?: boolean
}) {
  if (!verified || !verifiedAt) return null

  const date = new Date(verifiedAt)
  if (Number.isNaN(date.getTime())) return null

  const label = date.toLocaleDateString('en-US', FORMAT)
  const title = `Links last confirmed working on ${label}. Not an endorsement or a legal review.`

  const pill = (
    <span
      className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 rounded-full px-2.5 py-1"
      title={title}
    >
      <ShieldCheck className="w-3 h-3" strokeWidth={2.5} aria-hidden="true" />
      {showDate ? `Verified ${label}` : 'Verified'}
    </span>
  )

  // On cards the pill sits inside a wrapping <Link> to the listing, so it must
  // not contain another anchor — nested interactive elements are invalid HTML
  // and break keyboard navigation. Only the detail page gets the explainer link.
  if (!showDate) return pill

  return (
    <Link
      href="/about#verified"
      className="inline-flex rounded-full hover:opacity-80 transition-opacity"
      aria-label={title}
    >
      {pill}
    </Link>
  )
}
