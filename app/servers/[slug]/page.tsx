import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SoftwareAppJsonLd } from '../../components/JsonLd'
import { ListingCard } from '../../components/ListingCard'
import { VerifiedBadge } from '../../components/VerifiedBadge'
import { LeadGenCTA } from '../../components/LeadGenCTA'
import { FeatureListingCTA } from '../../components/FeatureListingCTA'
import { CATEGORY_LABELS, PRICING_LABELS, SITE_URL } from '@/lib/constants'
import { sanitizeLogoUrl } from '@/lib/logo-url'
import { LISTING_CARD_COLUMNS, type ListingCardData } from '@/lib/types'

/**
 * Listings that have a hand-written setup guide. Without this link the guides
 * are orphans — nothing on the site pointed at them, which is the likeliest
 * reason /guides/connect-claude-to-courtlistener never ranked despite matching
 * its target query. Add a row here whenever a new guide ships.
 */
const SETUP_GUIDES: Record<string, { path: string; label: string }> = {
  'courtlistener-mcp': {
    path: '/guides/connect-claude-to-courtlistener',
    label: 'How to connect Claude to CourtListener',
  },
  'harvey-mcp': {
    path: '/guides/connect-claude-to-harvey',
    label: 'How to connect Claude to Harvey AI',
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (!supabase) return { title: 'Tool Not Found' }

  // Q3: metadata only needs name/tagline/slug — skip the 2000-char description.
  const { data: listing } = await supabase
    .from('listings')
    .select('name, tagline, slug')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!listing) return { title: 'Tool Not Found' }

  return {
    title: `${listing.name} — AI Tool for Law Firms`,
    description: listing.tagline,
    alternates: { canonical: `${SITE_URL}/servers/${listing.slug}` },
    openGraph: {
      title: listing.name,
      description: listing.tagline,
      type: 'website',
    },
  }
}

export async function generateStaticParams() {
  if (!supabase) return []
  const { data } = await supabase
    .from('listings')
    .select('slug')
    .eq('status', 'published')
  return (data ?? []).map((l: { slug: string }) => ({ slug: l.slug }))
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (!supabase) notFound()

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!listing) notFound()

  // Fetch up to 3 related listings in the same category, excluding the current
  // one. Q3: card columns only — the related grid never shows description.
  const { data: relatedData } = await supabase
    .from('listings')
    .select(LISTING_CARD_COLUMNS)
    .eq('status', 'published')
    .eq('category', listing.category)
    .neq('id', listing.id)
    .limit(3)

  const related: ListingCardData[] = relatedData ?? []

  const categoryLabel = CATEGORY_LABELS[listing.category] ?? listing.category
  const pricingLabel = PRICING_LABELS[listing.pricing_model] ?? listing.pricing_model
  // S4: strict https-only parse before the URL reaches <img src>.
  const logoSrc = sanitizeLogoUrl(listing.logo_url)

  return (
    <main className="max-w-content mx-auto px-4 py-12">
      <SoftwareAppJsonLd listing={listing} />

      {/* Breadcrumb */}
      <nav className="text-sm font-body text-charcoal/50 mb-8">
        <Link href="/servers" className="hover:text-gold-text transition-colors">
          Browse Tools
        </Link>
        <span className="mx-2">/</span>
        <span>{listing.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-start gap-5 mb-4">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt={`${listing.name} logo`}
              className="h-16 w-16 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <span className="text-navy font-sans font-bold text-2xl">
                {listing.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-4xl font-bold text-navy leading-tight">
              {listing.name}
            </h1>
            <p className="font-body text-lg text-charcoal/70 mt-2">{listing.tagline}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-slate-100 text-charcoal rounded-full px-2.5 py-1">
            {categoryLabel}
          </span>
          <span className="text-xs bg-amber-50 text-gold-text rounded-full px-2.5 py-1">
            {pricingLabel}
          </span>
          <VerifiedBadge
            verified={listing.verified}
            verifiedAt={listing.verified_at}
            showDate
          />
          {listing.featured && (
            <span
              className="text-xs bg-navy text-white rounded-full px-2.5 py-1"
              title="Sponsored or editorial Featured placement"
            >
              Featured
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <section className="mb-10 max-w-content">
        <p className="font-body text-charcoal/80 leading-relaxed whitespace-pre-line">
          {listing.description}
        </p>
      </section>

      {/* Setup guide, when we have written one for this listing */}
      {SETUP_GUIDES[listing.slug] && (
        <section className="mb-10 max-w-content">
          <Link
            href={SETUP_GUIDES[listing.slug].path}
            className="flex items-center justify-between gap-4 rounded-lg border border-gold/40 bg-gold/5 px-5 py-4 transition-colors hover:border-gold"
          >
            <span>
              <span className="block font-sans text-xs font-bold uppercase tracking-widest text-gold-text">
                Setup guide
              </span>
              <span className="block font-body text-charcoal mt-1">
                {SETUP_GUIDES[listing.slug].label}
              </span>
            </span>
            <span aria-hidden="true" className="font-body text-gold-text">&rarr;</span>
          </Link>
        </section>
      )}

      {/* Technical details */}
      {(listing.mcp_repo_url || listing.mcp_install_command) && (
        <details className="mb-10 border border-slate-200 rounded-lg p-4">
          <summary className="font-sans font-semibold text-sm cursor-pointer select-none text-navy">
            Technical Details
          </summary>
          <div className="mt-4 space-y-4">
            {listing.mcp_repo_url && (
              <div>
                <p className="text-xs text-charcoal/50 font-sans mb-1 uppercase tracking-wide">
                  MCP Repository
                </p>
                <a
                  href={listing.mcp_repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-gold-text hover:underline break-all"
                >
                  {listing.mcp_repo_url}
                </a>
              </div>
            )}
            {listing.mcp_install_command && (
              <div>
                <p className="text-xs text-charcoal/50 font-sans mb-1 uppercase tracking-wide">
                  Install Command
                </p>
                <code className="block bg-slate-100 rounded px-3 py-2 font-mono text-sm text-charcoal break-all">
                  {listing.mcp_install_command}
                </code>
              </div>
            )}
          </div>
        </details>
      )}

      {/* CTA button */}
      {listing.external_url && (
        <div className="mb-10">
          <a
            href={listing.external_url}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="btn-primary inline-flex items-center gap-2"
          >
            Get This Tool
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      )}


      {/* Featured / sponsored CTA — published listings only (this page is published-only) */}
      <FeatureListingCTA
        listingId={listing.id}
        slug={listing.slug}
        alreadyFeatured={Boolean(listing.featured)}
        featuredUntil={listing.featured_until ?? null}
      />

      {/* Tags */}
      {listing.tags && listing.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-12">
          {listing.tags.map((tag: string) => (
            <span
              key={tag}
              className="bg-slate-100 text-xs rounded-full px-2.5 py-1 text-charcoal/60"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Related listings */}
      {related.length > 0 && (
        <section className="mb-12">
          <h3 className="font-display text-2xl font-bold text-navy mb-6">Related Tools</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {related.map((rel) => (
              <ListingCard key={rel.id} listing={rel} />
            ))}
          </div>
        </section>
      )}

      <LeadGenCTA />
    </main>
  )
}
