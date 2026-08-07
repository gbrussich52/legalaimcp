import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { RoundupItem } from '../../components/RoundupItem'
import { LeadGenCTA } from '../../components/LeadGenCTA'
import { ItemListJsonLd, BreadcrumbJsonLd } from '../../components/JsonLd'
import { LISTING_CARD_COLUMNS, type ListingCardData } from '@/lib/types'
import { SITE_URL } from '@/lib/constants'
import { CATEGORY_CONTENT } from '@/lib/category-content'

/**
 * The flagship roundup page — the format gap this site had against
 * competitors (Spellbook, fast.io) who win "best MCP servers for legal"
 * searches with listicle pages despite having no comparable underlying data.
 * This site has a real 48-tool directory and its own MCP server listed in
 * the official Model Context Protocol registry; it just hadn't published
 * that data as a roundup. This page does, without inventing anything the
 * directory doesn't already know: every blurb below is the listing's own
 * tagline, and ranking pulls straight from the same `featured` /
 * `verified` signal the rest of the site uses — no separate hand-picked list.
 */

const PAGE_TITLE = 'The Best Legal MCP Servers in 2026 (From the Official Registry)'
const PAGE_DESCRIPTION =
  'The top legal AI tools and MCP servers, ranked from our 48-tool directory — the same data behind our own MCP server, which is listed in the official Model Context Protocol registry. Not a hand-picked blog list.'

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/best/legal-mcp-servers` },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: 'article',
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
      <ItemListJsonLd listings={listings} name="The Best Legal MCP Servers" />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Browse Tools', path: '/servers' },
          { name: 'Best Legal MCP Servers', path: '/best/legal-mcp-servers' },
        ]}
      />

      <main className="max-w-content mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 font-body text-sm text-charcoal/50">
            <li>
              <Link href="/" className="hover:text-gold-text transition-colors">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/servers" className="hover:text-gold-text transition-colors">Browse Tools</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-charcoal">Best Legal MCP Servers</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-10 max-w-3xl">
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-3">
            Updated 2026
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-navy leading-tight">
            The Best Legal MCP Servers in 2026
          </h1>
          <p className="font-body text-lg text-charcoal/70 mt-5 leading-relaxed">
            LegalAIMCP runs its own MCP server, and it&apos;s listed in the
            official Model Context Protocol registry — the same open registry
            Claude, Smithery, and Glama pull from. This roundup is pulled from
            the 48-tool directory that server serves, ranked by the same
            featured and verified signals used everywhere else on this site.
            It isn&apos;t a list assembled for a blog post.
          </p>
          <p className="font-body text-sm text-charcoal/50 mt-4">
            Ranked from our{' '}
            <Link href="/servers" className="text-gold-text font-semibold hover:underline">
              full directory of AI tools for law firms
            </Link>
            . Every listing below has a full profile with pricing, install
            instructions where applicable, and{' '}
            <Link href="/about#verified" className="text-gold-text font-semibold hover:underline">
              our verification status
            </Link>
            .
          </p>
        </div>

        {/* Ranked roundup */}
        {listings.length > 0 ? (
          <ol className="space-y-5">
            {listings.map((listing, i) => (
              <RoundupItem key={listing.id} listing={listing} rank={i + 1} />
            ))}
          </ol>
        ) : (
          <p className="font-body text-charcoal/60 text-center py-16">
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
              . Ranking is not manual: it follows a firm&apos;s featured status
              in the directory, then whether an automated check most recently
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
            <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-4">
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
