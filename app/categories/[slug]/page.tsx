import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ListingCard } from '../../components/ListingCard'
import { LeadGenCTA } from '../../components/LeadGenCTA'
import { ItemListJsonLd } from '../../components/JsonLd'
import { SITE_URL } from '@/lib/constants'
import { LISTING_CARD_COLUMNS, type ListingCardData, type Category } from '@/lib/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (!supabase) return { title: 'Category Not Found' }

  // Q3: metadata only needs name + description.
  const { data: category } = await supabase
    .from('categories')
    .select('name, description')
    .eq('slug', slug)
    .single()

  if (!category) return { title: 'Category Not Found' }

  return {
    title: `${category.name} — AI Tools for Law Firms`,
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

  // Fetch category by slug
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single<Category>()

  if (!category) {
    notFound()
  }

  // Category slugs use hyphens ('document-processing'), enum uses underscores ('document_processing')
  const categoryEnum = slug.replace(/-/g, '_')

  // Q3: card columns only — the category grid never renders description.
  const { data: listings } = await supabase
    .from('listings')
    .select(LISTING_CARD_COLUMNS)
    .eq('status', 'published')
    .eq('category', categoryEnum)
    .order('featured', { ascending: false })
    .order('name', { ascending: true })

  const safeListings: ListingCardData[] = listings || []

  return (
    <>
      <ItemListJsonLd listings={safeListings} name={category.name} />

      <main className="max-w-content mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold text-navy mb-3">
            {category.name}
          </h1>
          {category.description && (
            <p className="font-body text-lg text-charcoal/70 max-w-content">
              {category.description}
            </p>
          )}
        </div>

        {/* Listings grid */}
        {safeListings.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <p className="font-body text-charcoal/60 text-center py-16">
            No tools in this category yet.
          </p>
        )}

        {/* Lead gen CTA */}
        <div className="mt-16">
          <LeadGenCTA />
        </div>
      </main>
    </>
  )
}
