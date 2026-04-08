import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ListingCard } from './components/ListingCard'
import { CategoryCard } from './components/CategoryCard'
import { LeadGenCTA } from './components/LeadGenCTA'
import type { Listing, Category } from '@/lib/types'

export const metadata: Metadata = {
  title: 'LegalAIMCP — AI Integrations for Law Firms',
  description:
    'The curated directory of AI-powered integrations for law firms. Find MCP servers for contract review, case management, legal research, and more.',
  alternates: { canonical: 'https://legalaimcp.com' },
}

export default async function HomePage() {
  // Supabase is null when env vars are not configured — graceful empty state
  const [featuredListings, categories, countData] = supabase
    ? await Promise.all([
        supabase
          .from('listings')
          .select('*')
          .eq('status', 'published')
          .eq('featured', true)
          .limit(6)
          .then((r) => r.data),
        supabase
          .from('categories')
          .select('*')
          .order('display_order')
          .then((r) => r.data),
        supabase
          .from('listings')
          .select('category')
          .eq('status', 'published')
          .then((r) => r.data),
      ])
    : [null, null, null]

  const categoryCounts: Record<string, number> = {}
  for (const row of countData ?? []) {
    categoryCounts[row.category] = (categoryCounts[row.category] ?? 0) + 1
  }

  const typedListings = (featuredListings ?? []) as Listing[]
  const typedCategories = (categories ?? []) as Category[]

  return (
    <>
      {/* ── 1. Hero ── */}
      <section className="bg-gradient-to-b from-navy to-[#1E293B] text-white py-28 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-5xl sm:text-6xl font-bold leading-tight">
            The directory for AI-powered legal tools.
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mt-6 font-body leading-relaxed">
            Find MCP integrations that connect AI directly to your case management, document
            review, and legal research workflows.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link
              href="/servers"
              className="btn-primary bg-white text-navy hover:bg-slate-100"
            >
              Browse Tools →
            </Link>
            <Link
              href="/submit"
              className="border border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-lg font-sans font-semibold transition-colors"
            >
              Submit a Tool
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Featured Listings ── */}
      <section className="section-padding bg-warm-white">
        <div className="max-w-7xl mx-auto px-6">
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-2">
            Featured
          </p>
          <h2 className="font-display text-3xl font-bold text-navy">
            Handpicked AI integrations
          </h2>

          {typedListings.length > 0 ? (
            <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {typedListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <p className="mt-10 text-charcoal/50 font-body">
              Coming soon — we&apos;re curating the best legal AI tools.
            </p>
          )}
        </div>
      </section>

      {/* ── 3. Categories ── */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-navy text-center">
            Browse by category
          </h2>

          {typedCategories.length > 0 ? (
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {typedCategories.map((category) => (
                <CategoryCard
                  key={category.slug}
                  category={category}
                  count={categoryCounts[category.slug] ?? 0}
                />
              ))}
            </div>
          ) : (
            <p className="mt-10 text-charcoal/50 font-body text-center">
              Categories coming soon.
            </p>
          )}
        </div>
      </section>

      {/* ── 4. What is MCP? ── */}
      <section className="section-padding bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-navy">
            What is MCP?
          </h2>
          <p className="font-body text-lg text-charcoal/80 max-w-content mx-auto mt-6 leading-relaxed">
            Model Context Protocol (MCP) is a universal standard that lets AI assistants connect
            directly to your existing tools — your case management system, document storage,
            billing software, and more. Think of it as a secure adapter between AI and the
            software your firm already uses. Instead of copying data between systems, MCP lets
            your AI read, search, and act on your data in real time. For law firms, this means
            fewer manual handoffs, faster research, and AI that actually understands your practice.
          </p>
          <Link
            href="/about"
            className="text-gold-text font-sans font-semibold inline-block mt-6 hover:underline"
          >
            Learn more about LegalAIMCP →
          </Link>
        </div>
      </section>

      {/* ── 5. Lead Gen CTA ── */}
      <section className="section-padding bg-warm-white">
        <div className="max-w-7xl mx-auto px-6">
          <LeadGenCTA />
        </div>
      </section>
    </>
  )
}
