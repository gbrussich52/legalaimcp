// Claude Sonnet 5.5, 2026-11-12: pure builder for the listing SoftwareApplication JSON-LD so a
// test can pin the offer rule. Ahrefs 11/12 reported schema errors on 22 pages: every non-free
// listing emitted an Offer with a description but no price or priceCurrency, which Google's
// product/software rich-result rules reject.
import { SITE_URL } from '@/lib/constants'
import type { Listing } from '@/lib/types'

type SchemaListing = Pick<Listing, 'pricing_model' | 'name' | 'tagline' | 'slug'>

export function softwareAppSchema(listing: SchemaListing) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: listing.name,
    description: listing.tagline,
    applicationCategory: 'Legal',
    url: `${SITE_URL}/servers/${listing.slug}`,
    // Only a free listing has a real price (0). Paid, freemium and contact-sales listings have no
    // stated number, so no Offer is emitted rather than an invalid one.
    ...(listing.pricing_model === 'free'
      ? { offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }
      : {}),
  }
}
