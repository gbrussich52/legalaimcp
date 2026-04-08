import { SITE_NAME, SITE_URL, NYCLAW_URL } from '@/lib/constants'
import type { Listing } from '@/lib/types'

export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'The curated directory of AI-powered integrations for law firms.',
    publisher: {
      '@type': 'Organization',
      name: 'NYClaw.io',
      url: NYCLAW_URL,
    },
  }

  return (
    <script
      type="application/ld+json"
      // Safe: content is hardcoded server-side constants and structured JSON-LD — never user input
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    parentOrganization: {
      '@type': 'Organization',
      name: 'NYClaw.io',
      url: NYCLAW_URL,
    },
  }

  return (
    <script
      type="application/ld+json"
      // Safe: content is hardcoded server-side constants — never user input
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function SoftwareAppJsonLd({ listing }: { listing: Listing }) {
  const offers =
    listing.pricing_model === 'free'
      ? { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
      : {
          '@type': 'Offer',
          description: listing.pricing_details ?? listing.pricing_model,
        }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: listing.name,
    description: listing.tagline,
    applicationCategory: 'Legal',
    url: `${SITE_URL}/servers/${listing.slug}`,
    offers,
  }

  return (
    <script
      type="application/ld+json"
      // Safe: listing data comes from our own Supabase DB (server-side), never raw user HTML
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function ItemListJsonLd({
  listings,
  name,
}: {
  listings: Listing[]
  name: string
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: listings.length,
    itemListElement: listings.map((listing, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/servers/${listing.slug}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      // Safe: data is serialized to JSON (no raw HTML) and comes from our own Supabase DB
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
