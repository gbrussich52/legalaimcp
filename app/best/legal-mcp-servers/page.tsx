import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { RoundupItem } from '../../components/RoundupItem'
import { LeadGenCTA } from '../../components/LeadGenCTA'
import { ItemListJsonLd, BreadcrumbJsonLd } from '../../components/JsonLd'
import { LISTING_CARD_COLUMNS, type ListingCardData } from '@/lib/types'
import { SITE_URL } from '@/lib/constants'
import { CATEGORY_CONTENT } from '@/lib/category-content'

const PAGE_TITLE = 'Legal MCP Servers & AI Tools: Compare Before Setup'
const PAGE_DESCRIPTION =
  'Compare legal MCP servers and AI tools by workflow, pricing, and connection requirements. Understand listing order and link checks before choosing.'

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/best/legal-mcp-servers` },
  openGraph: {
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'LegalAIMCP — legal AI tools and MCP servers' }],
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: 'website',
    url: `${SITE_URL}/best/legal-mcp-servers`,
  },
}

const ROUNDUP_SIZE = 12

export default async function BestLegalMcpServersPage() {
  let listings: ListingCardData[] = []

  if (supabase) {
    const { data } = await supabase
      .from('listings')
      .select(LISTING_CARD_COLUMNS)
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('verified', { ascending: false })
      .order('name', { ascending: true })
      .limit(ROUNDUP_SIZE)

    listings = data ?? []
  }

  const categoryLinks = Object.entries(CATEGORY_CONTENT)

  return (
    <>
      <ItemListJsonLd listings={listings} name="Legal MCP Servers and AI Tools" />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Browse Tools', path: '/servers' },
          { name: 'Compare Legal MCP Servers', path: '/best/legal-mcp-servers' },
        ]}
      />

      <main className="max-w-content mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 font-body text-sm text-charcoal/80">
            <li>
              <Link href="/" className="hover:text-gold-text transition-colors">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/servers" className="hover:text-gold-text transition-colors">Browse Tools</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-charcoal">Compare Legal MCP Servers</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-10 max-w-3xl">
          <p className="font-sans text-xs font-bold text-gold-text mb-3">
            Reviewed October 17, 2026
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-navy leading-tight">
            Compare legal MCP servers and AI tools
          </h1>
          <p className="font-body text-lg text-charcoal/75 mt-5 leading-relaxed">
            A legal MCP server exposes tools to an AI assistant through Model Context Protocol.
            A standalone legal AI product may have no MCP connection. This directory includes
            both: check each listing&apos;s repository, install instructions, and vendor documentation
            before assuming it works with your client.
          </p>
          <p className="font-body text-sm text-charcoal/80 mt-4">
            Selected from our{' '}
            <Link href="/servers" className="text-gold-text font-semibold hover:underline">
              full directory of AI tools for law firms
            </Link>
            . Featured listings appear first, then listings whose links passed a check, then name.
            This is directory ordering, not a performance ranking; paid Featured placements can affect
            position. Every listing below has a profile with pricing, install
            instructions where applicable, and{' '}
            <Link href="/about#verified" className="text-gold-text font-semibold hover:underline">
              our verification status
            </Link>
            .
          </p>
        </div>

        <section className="mb-10 max-w-3xl font-body text-charcoal/80 space-y-3">
          <h2 className="font-display text-2xl font-bold text-navy">How to choose a legal MCP server</h2>
          <p>Start with one workflow: <Link href="/categories/legal-research" className="text-gold-text underline">legal research</Link>,{' '}
            <Link href="/categories/document-processing" className="text-gold-text underline">document processing</Link>, or{' '}
            <Link href="/categories/case-management" className="text-gold-text underline">case management</Link>.
            Confirm jurisdiction and source coverage for research, and file formats and permissions for document work.</p>
          <p>Check who maintains the server, whether the vendor supports it, the transport your
            client accepts, authentication, and any separate product subscription. A free MCP
            connector does not make the connected product free.</p>
          <p>A link-check badge confirms that URLs resolved on the stated date. It does not test
            security, legal accuracy, or compatibility. Review data handling before using client
            information and test with fictional examples first.</p>
          <p>To search these listings from your assistant, <Link href="/mcp" className="text-gold-text underline">connect our free directory MCP server</Link>.
            It returns tool listings, not case law or access to your firm&apos;s systems.</p>
        </section>

        {/* Directory order, not an editorial quality ranking. */}
        {listings.length > 0 ? (
          <ol className="space-y-5">
            {listings.map((listing) => (
              <RoundupItem key={listing.id} listing={listing} />
            ))}
          </ol>
        ) : (
          <p className="font-body text-charcoal/75 text-center py-16">
            The directory is temporarily unavailable.{' '}
            <Link href="/servers" className="text-gold-text font-semibold hover:underline">
              Browse the full list
            </Link>
            .
          </p>
        )}

        {/* Methodology */}
        <section className="mt-14 border-t border-slate-200 pt-10 max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-navy mb-4">How this list is built</h2>
          <div className="font-body text-charcoal/80 space-y-3 leading-relaxed">
            <p>
              Every listing above comes from the same Supabase-backed
              directory that powers the rest of this site and our{' '}
              <Link href="/mcp" className="text-gold-text font-semibold hover:underline">
                own MCP server
              </Link>
              . Ordering is not a quality score: it follows a firm&apos;s featured status
              in the directory (including paid placements), then whether an automated check most recently
              confirmed the listing&apos;s links resolve, then name.
            </p>
            <p>
              Descriptions here are the same taglines shown on each tool&apos;s
              full listing page — we don&apos;t write separate marketing copy
              for this page. Click through to a listing for pricing details,
              install commands where one exists, and the date of the last
              link check.
            </p>
          </div>
        </section>

        {/* Category cross-links */}
        {categoryLinks.length > 0 && (
          <section className="mt-14 border-t border-slate-200 pt-10">
            <h2 className="font-sans text-xs font-bold text-gold-text mb-4">
              Best by practice area
            </h2>
            <div className="flex flex-wrap gap-2">
              {categoryLinks.map(([slug, content]) => (
                <Link
                  key={slug}
                  href={`/best/${slug}-mcp-servers`}
                  className="font-body text-sm border border-slate-200 rounded-full px-4 py-2 text-charcoal hover:border-navy/30 hover:text-navy transition-colors"
                >
                  {content.headline}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Lead gen */}
        <div className="mt-14">
          <LeadGenCTA />
        </div>
      </main>
    </>
  )
}
