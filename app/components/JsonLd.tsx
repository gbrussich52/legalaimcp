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
    // Public GitHub profile behind the build + the repo for this site itself
    // (github.com/gbrussich52/legalaimcp, verified public). Both are real,
    // checkable URLs — no social profiles invented to pad this out.
    sameAs: ['https://github.com/gbrussich52', 'https://github.com/gbrussich52/legalaimcp', 'https://glama.ai/mcp/connectors/com.legalaimcp/directory'],
    parentOrganization: {
      '@type': 'Organization',
      name: 'NYClaw.io',
      url: NYCLAW_URL,
    },
    founder: {
      '@type': 'Person',
      name: 'Giani Brussich',
      sameAs: [
        'https://linkedin.com/in/gianib',
        'https://github.com/gbrussich52',
        'https://gianibrussich.com',
      ],
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

/**
 * SoftwareApplication schema for LegalAIMCP's own MCP server (the /mcp
 * install page) — the site's only first-party product, distinct from the
 * third-party listings SoftwareAppJsonLd below describes.
 */
export function McpServerJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `${SITE_NAME} MCP Server`,
    description:
      'Free, read-only MCP server for searching the LegalAIMCP directory of AI tools for law firms from Claude, ChatGPT, or any MCP client. No API key or account required.',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    url: `${SITE_URL}/mcp`,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
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
  // Only slug is used — accepts full Listing rows or Q3 card-column subsets.
  listings: Pick<Listing, 'slug'>[]
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

/**
 * Serializes schema for a JSON-LD <script> tag. Escaping `<` (→ <) is
 * the one injection vector JSON.stringify alone leaves open: a string
 * containing "</script>" would otherwise terminate the tag early. Our content
 * is authored, but the escape costs nothing and holds if that ever changes.
 */
const toJsonLd = (schema: object) => JSON.stringify(schema).replace(/</g, '\\u003c')

/**
 * FAQPage schema for category landing pages.
 *
 * Content comes from lib/category-content.ts — authored, static, and plain
 * strings by design. FAQ rich results require the on-page text to match the
 * schema text, which is another reason the content layer stores answers as
 * strings rather than JSX: one source renders both.
 */
export function FAQJsonLd({ faqs }: { faqs: readonly { q: string; a: string }[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <script
      type="application/ld+json"
      // Safe: authored static content from lib/category-content.ts, serialized
      // with < escaped so no string can terminate the script tag early.
      dangerouslySetInnerHTML={{ __html: toJsonLd(schema) }}
    />
  )
}

/** BreadcrumbList schema — pairs with the visible breadcrumb on category pages. */
export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; path: string }[]
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      // Safe: static route names and paths, serialized with < escaped.
      dangerouslySetInnerHTML={{ __html: toJsonLd(schema) }}
    />
  )
}
