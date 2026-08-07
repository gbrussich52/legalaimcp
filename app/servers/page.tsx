import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ListingCard } from '../components/ListingCard'
import { SearchBar } from '../components/SearchBar'
import { ListingFilters } from '../components/ListingFilters'
import { LeadGenCTA } from '../components/LeadGenCTA'
import { ItemListJsonLd } from '../components/JsonLd'
import { LISTING_CARD_COLUMNS, type ListingCardData } from '@/lib/types'
import { CATEGORY_LABELS, PRICING_LABELS } from '@/lib/constants'
import { sanitizeSearchQuery } from '@/lib/search'

const PAGE_SIZE = 12

export const metadata: Metadata = {
  title: 'Browse AI Tools for Law Firms',
  description:
    'Search and filter AI-powered integrations for law firms. Find MCP servers for document processing, case management, legal research, and more.',
  alternates: { canonical: 'https://legalaimcp.com/servers' },
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; pricing?: string; q?: string; page?: string }>
}) {
  const params = await searchParams

  // Validate category and pricing against their respective allowlists.
  // Unknown param values are ignored rather than passed to the DB query.
  const category =
    params.category && Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, params.category)
      ? params.category
      : undefined
  const pricing =
    params.pricing && Object.prototype.hasOwnProperty.call(PRICING_LABELS, params.pricing)
      ? params.pricing
      : undefined

  // Sanitize q: strip PostgREST structural chars and cap at 100 chars.
  const q = params.q ? sanitizeSearchQuery(params.q) : undefined

  const currentPage = Math.max(1, parseInt(params.page || '1', 10))

  let listings: ListingCardData[] = []
  let totalCount = 0

  if (supabase) {
    // Count query for pagination
    let countQuery = supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
    if (category) countQuery = countQuery.eq('category', category)
    if (pricing) countQuery = countQuery.eq('pricing_model', pricing)
    if (q) countQuery = countQuery.or(`name.ilike.%${q}%,tagline.ilike.%${q}%`)
    const { count } = await countQuery
    totalCount = count ?? 0

    // Data query with pagination (Q3: card columns only — no description)
    let query = supabase.from('listings').select(LISTING_CARD_COLUMNS).eq('status', 'published')
    if (category) query = query.eq('category', category)
    if (pricing) query = query.eq('pricing_model', pricing)
    if (q) query = query.or(`name.ilike.%${q}%,tagline.ilike.%${q}%`)

    query = query
      .order('featured', { ascending: false })
      .order('name')
      .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1)

    const { data, error } = await query
    listings = error ? [] : (data ?? [])
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Build pagination URL helper
  function pageUrl(page: number) {
    const p = new URLSearchParams()
    if (category) p.set('category', category)
    if (pricing) p.set('pricing', pricing)
    if (q) p.set('q', q)
    if (page > 1) p.set('page', String(page))
    const qs = p.toString()
    return `/servers${qs ? `?${qs}` : ''}`
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <ItemListJsonLd listings={listings} name="AI Tools for Law Firms" />

      <h1 className="font-display text-4xl font-bold text-navy mb-2">
        Browse AI Tools for Law Firms
      </h1>
      {totalCount > 0 && (
        <p className="text-sm text-charcoal/50 font-body mb-2">
          {totalCount} tool{totalCount !== 1 ? 's' : ''} available
        </p>
      )}
      <p className="text-sm text-charcoal/50 font-body mb-8">
        Not sure where to start?{' '}
        <Link href="/best/legal-mcp-servers" className="text-gold-text font-semibold hover:underline">
          See our ranked picks: The Best Legal MCP Servers in 2026 →
        </Link>
      </p>

      {/* Search + filter controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="flex-1">
          <SearchBar />
        </div>
        <ListingFilters />
      </div>

      {/* Listings grid */}
      {listings.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-charcoal/50 font-body">
          <p className="text-lg">No tools found matching your criteria.</p>
          <p className="text-sm mt-2">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Pagination">
          {currentPage > 1 && (
            <Link
              href={pageUrl(currentPage - 1)}
              className="px-4 py-2 text-sm font-sans text-charcoal border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Previous
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Link
              key={page}
              href={pageUrl(page)}
              className={`w-10 h-10 flex items-center justify-center text-sm font-sans rounded-lg transition-colors ${
                page === currentPage
                  ? 'bg-navy text-white'
                  : 'text-charcoal border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {page}
            </Link>
          ))}
          {currentPage < totalPages && (
            <Link
              href={pageUrl(currentPage + 1)}
              className="px-4 py-2 text-sm font-sans text-charcoal border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Next
            </Link>
          )}
        </nav>
      )}

      {/* Lead gen */}
      <div className="mt-12">
        <LeadGenCTA />
      </div>
    </main>
  )
}
