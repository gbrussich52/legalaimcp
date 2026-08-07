import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { RoundupItem } from '../../components/RoundupItem'
import { LeadGenCTA } from '../../components/LeadGenCTA'
import { ItemListJsonLd, BreadcrumbJsonLd } from '../../components/JsonLd'
import { LISTING_CARD_COLUMNS, type ListingCardData } from '@/lib/types'
import { SITE_URL } from '@/lib/constants'
import { CATEGORY_CONTENT } from '@/lib/category-content'

/**
 * Per-category "best of" roundup pages — /best/{category}-mcp-servers.
 *
 * Deliberately distinct from /categories/[slug]: that page is a buyer's
 * guide (intro + full grid + criteria + FAQ) for someone still deciding
 * whether to look in this category at all. This page is the editorial
 * roundup format ("best X MCP servers") that ranks the category's top
 * listings for someone who already knows what they want and is comparing
 * options — same underlying data, different intent, cross-linked both ways
 * so neither page competes with the other for the same search query.
 *
 * Category slugs here are hyphenated ('legal-research') per
 * lib/category-content.ts; the listings table's category enum uses
 * underscores ('legal_research') — same mapping the category page uses.
 */

const ROUNDUP_SUFFIX = '-mcp-servers'
const ROUNDUP_SIZE = 10

function categorySlugFromParam(param: string): string | null {
  if (!param.endsWith(ROUNDUP_SUFFIX)) return null
  const categorySlug = param.slice(0, -ROUNDUP_SUFFIX.length)
  return CATEGORY_CONTENT[categorySlug] ? categorySlug : null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const categorySlug = categorySlugFromParam(slug)
  if (!categorySlug) return { title: 'Not Found' }

  const content = CATEGORY_CONTENT[categorySlug]
  const title = `Best ${content.headline} — Ranked`
  const description = `The top-ranked ${content.headline.toLowerCase()} in our directory, with pricing and MCP install details for each.`

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/best/${slug}` },
    openGraph: { title, description, type: 'article' },
  }
}

export function generateStaticParams() {
  return Object.keys(CATEGORY_CONTENT).map((slug) => ({
    slug: `${slug}${ROUNDUP_SUFFIX}`,
  }))
}

export default async function BestCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const categorySlug = categorySlugFromParam(slug)
  if (!categorySlug) notFound()

  const content = CATEGORY_CONTENT[categorySlug]
  const categoryEnum = categorySlug.replace(/-/g, '_')

  if (!supabase) notFound()

  const { data } = await supabase
    .from('listings')
    .select(LISTING_CARD_COLUMNS)
    .eq('status', 'published')
    .eq('category', categoryEnum)
    .order('verified', { ascending: false })
    .order('featured', { ascending: false })
    .order('name', { ascending: true })
    .limit(ROUNDUP_SIZE)

  const listings: ListingCardData[] = data ?? []

  const pageTitle = `Best ${content.headline}`

  return (
    <>
      <ItemListJsonLd listings={listings} name={pageTitle} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Browse Tools', path: '/servers' },
          { name: pageTitle, path: `/best/${slug}` },
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
            <li aria-current="page" className="text-charcoal">{pageTitle}</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-10 max-w-3xl">
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-3">
            Ranked
          </p>
          <h1 className="font-display text-4xl font-bold text-navy leading-tight">{pageTitle}</h1>
          <p className="font-body text-lg text-charcoal/70 mt-4 leading-relaxed">
            The top-ranked tools in this category from our directory, ordered
            by verification status and featured placement. For the full
            buyer&apos;s guide — what this category covers, what to check
            before you buy, and answers to common questions — see the{' '}
            <Link
              href={`/categories/${categorySlug}`}
              className="text-gold-text font-semibold hover:underline"
            >
              {content.headline} guide
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
            No tools in this category yet.{' '}
            <Link href="/submit" className="text-gold-text font-semibold hover:underline">
              Know one that belongs here?
            </Link>
          </p>
        )}

        {/* Cross-link back to the flagship roundup and every other category */}
        <section className="mt-14 border-t border-slate-200 pt-10">
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-4">
            More rankings
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/best/legal-mcp-servers"
              className="font-body text-sm border border-slate-200 rounded-full px-4 py-2 text-charcoal hover:border-navy/30 hover:text-navy transition-colors"
            >
              The Best Legal MCP Servers (all categories)
            </Link>
            {Object.entries(CATEGORY_CONTENT)
              .filter(([s]) => s !== categorySlug)
              .map(([s, c]) => (
                <Link
                  key={s}
                  href={`/best/${s}${ROUNDUP_SUFFIX}`}
                  className="font-body text-sm border border-slate-200 rounded-full px-4 py-2 text-charcoal hover:border-navy/30 hover:text-navy transition-colors"
                >
                  {c.headline}
                </Link>
              ))}
          </div>
        </section>

        {/* Lead gen */}
        <div className="mt-14">
          <LeadGenCTA />
        </div>
      </main>
    </>
  )
}
