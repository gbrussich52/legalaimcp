import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { ListingCard } from '../components/ListingCard'
import { SearchBar } from '../components/SearchBar'
import { ListingFilters } from '../components/ListingFilters'
import { LeadGenCTA } from '../components/LeadGenCTA'
import { ItemListJsonLd } from '../components/JsonLd'
import type { Listing } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Browse AI Tools for Law Firms',
  description:
    'Search and filter AI-powered integrations for law firms. Find MCP servers for document processing, case management, legal research, and more.',
  alternates: { canonical: 'https://legalaimcp.com/servers' },
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; pricing?: string; q?: string }>
}) {
  const params = await searchParams
  const { category, pricing, q } = params

  // Supabase is null when env vars are not configured — graceful empty state
  let listings: Listing[] = []

  if (supabase) {
    let query = supabase.from('listings').select('*').eq('status', 'published')

    if (category) {
      query = query.eq('category', category)
    }
    if (pricing) {
      query = query.eq('pricing_model', pricing)
    }
    if (q) {
      query = query.ilike('name', `%${q}%`)
    }

    query = query.order('featured', { ascending: false }).order('name')

    const { data, error } = await query
    listings = error ? [] : (data ?? [])
  }

  return (
    <main className="max-w-content mx-auto px-4 py-12">
      <ItemListJsonLd listings={listings} name="AI Tools for Law Firms" />

      <h1 className="font-display text-4xl font-bold text-navy mb-8">
        Browse AI Tools for Law Firms
      </h1>

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

      {/* Lead gen */}
      <LeadGenCTA />
    </main>
  )
}
