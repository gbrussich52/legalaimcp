import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ListingCard } from '../../components/ListingCard'
import { LeadGenCTA } from '../../components/LeadGenCTA'
import { ItemListJsonLd, FAQJsonLd, BreadcrumbJsonLd } from '../../components/JsonLd'
import { SITE_URL } from '@/lib/constants'
import { CATEGORY_CONTENT } from '@/lib/category-content'
import { LISTING_CARD_COLUMNS, type ListingCardData, type Category } from '@/lib/types'

/**
 * Category landing pages — the site's long-tail SEO surface.
 *
 * Before 2026-07-28 this page was an h1, one database sentence, and a card
 * grid. For the queries these pages exist to win ("AI contract review tools
 * for law firms", "legal research AI"), that is a list, not a landing page.
 * The editorial layer (lib/category-content.ts) adds what a buyer needs and
 * what thin pages lack: an honest buyer's guide, selection criteria, and the
 * FAQs a visitor would otherwise bounce back to search results to answer —
 * now with FAQPage + BreadcrumbList structured data to match.
 *
 * Content discipline: everything rendered here follows the same rules as the
 * rest of the site post-cleanup — no invented stats, no legal advice, ethics
 * questions routed to the reader's own bar. See the header comment in
 * lib/category-content.ts before editing copy.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (!supabase) return { title: 'Category Not Found' }

  const { data: category } = await supabase
    .from('categories')
    .select('name, description')
    .eq('slug', slug)
    .single()

  if (!category) return { title: 'Category Not Found' }

  const content = CATEGORY_CONTENT[slug]
  return {
    // The editorial headline carries search intent better than the bare
    // category name ("AI Document & Contract Tools for Law Firms" vs
    // "Document Processing").
    title: content ? content.headline : `${category.name} — AI Tools for Law Firms`,
    description: category.description,
    alternates: { canonical: `${SITE_URL}/categories/${slug}` },
  }
}

export async function generateStaticParams() {
  if (!supabase) return []
  const { data } = await supabase.from('categories').select('slug')
  return (data || []).map((c: { slug: string }) => ({ slug: c.slug }))
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (!supabase) notFound()

  // One round-trip for everything: this category, its listings, and the
  // sibling list for cross-links. Category slugs use hyphens
  // ('document-processing'); the listings enum uses underscores.
  const categoryEnum = slug.replace(/-/g, '_')
  const [categoryRes, listingsRes, siblingsRes] = await Promise.all([
    supabase.from('categories').select('*').eq('slug', slug).single<Category>(),
    supabase
      .from('listings')
      .select(LISTING_CARD_COLUMNS)
      .eq('status', 'published')
      .eq('category', categoryEnum)
      // Verified first for the same reason the MCP server orders this way:
      // surface what we can stand behind ahead of what we chose to highlight.
      .order('verified', { ascending: false })
      .order('featured', { ascending: false })
      .order('name', { ascending: true }),
    supabase.from('categories').select('slug, name').neq('slug', slug).order('name'),
  ])

  const category = categoryRes.data
  if (!category) notFound()

  const safeListings: ListingCardData[] = listingsRes.data || []
  const siblings = siblingsRes.data || []
  const verifiedCount = safeListings.filter((l) => l.verified && l.verified_at).length
  const content = CATEGORY_CONTENT[slug]

  return (
    <>
      <ItemListJsonLd listings={safeListings} name={category.name} />
      {content && <FAQJsonLd faqs={content.faqs} />}
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Browse Tools', path: '/servers' },
          { name: category.name, path: `/categories/${slug}` },
        ]}
      />

      <main className="max-w-content mx-auto px-4 py-12">
        {/* Breadcrumb — visible counterpart of the BreadcrumbList schema */}
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
            <li aria-current="page" className="text-charcoal">{category.name}</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold text-navy mb-3">
            {content ? content.headline : category.name}
          </h1>
          {category.description && (
            <p className="font-body text-lg text-charcoal/70 max-w-content">
              {category.description}
            </p>
          )}
          {/* Live counts only — both derived from the rows below, so this
              line can never claim more than the page shows. */}
          <p className="font-body text-sm text-charcoal/50 mt-3">
            {safeListings.length} tool{safeListings.length === 1 ? '' : 's'} listed
            {verifiedCount > 0 && (
              <>
                {' '}· {verifiedCount} with{' '}
                <Link href="/about#verified" className="underline hover:text-gold-text transition-colors">
                  verified links
                </Link>
              </>
            )}
          </p>
        </div>

        {/* Buyer's-guide intro */}
        {content && (
          <div className="mb-12 max-w-3xl space-y-4">
            {content.intro.map((para) => (
              <p key={para.slice(0, 40)} className="font-body text-charcoal/80 leading-relaxed">
                {para}
              </p>
            ))}
          </div>
        )}

        {/* Listings grid */}
        {safeListings.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <p className="font-body text-charcoal/60 text-center py-16">
            No tools in this category yet.{' '}
            <Link href="/submit" className="text-gold-text font-semibold hover:underline">
              Know one that belongs here?
            </Link>
          </p>
        )}

        {/* What to look for */}
        {content && (
          <section className="mt-16 max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-navy mb-5">
              What to look for in this category
            </h2>
            <ul className="space-y-3">
              {content.criteria.map((c) => (
                <li key={c.slice(0, 40)} className="flex gap-3 font-body text-charcoal/80 leading-relaxed">
                  <span aria-hidden="true" className="text-gold-text font-bold shrink-0">→</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* FAQ — same zero-JS <details> pattern as the homepage FAQ */}
        {content && (
          <section className="mt-16 max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-navy mb-5">
              Common questions
            </h2>
            <ul className="space-y-3">
              {content.faqs.map(({ q, a }) => (
                <li key={q}>
                  <details className="group rounded-xl border border-slate-200 bg-white open:bg-warm-white open:border-navy/20 transition-colors">
                    <summary className="cursor-pointer list-none px-5 py-4 font-display text-lg font-semibold text-navy flex items-center justify-between gap-4">
                      <span>{q}</span>
                      <span
                        aria-hidden="true"
                        className="text-2xl text-gold-text group-open:rotate-45 transition-transform leading-none"
                      >
                        +
                      </span>
                    </summary>
                    <div className="px-5 pb-5 font-body text-charcoal/80 leading-relaxed">{a}</div>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Sibling categories — internal linking so category pages form a
            mesh instead of seven dead ends. */}
        {siblings.length > 0 && (
          <section className="mt-16 border-t border-slate-200 pt-10">
            <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-4">
              Other practice areas
            </h2>
            <div className="flex flex-wrap gap-2">
              {siblings.map((s) => (
                <Link
                  key={s.slug}
                  href={`/categories/${s.slug}`}
                  className="font-body text-sm border border-slate-200 rounded-full px-4 py-2 text-charcoal hover:border-navy/30 hover:text-navy transition-colors"
                >
                  {s.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Lead gen CTA */}
        <div className="mt-16">
          <LeadGenCTA />
        </div>
      </main>
    </>
  )
}
