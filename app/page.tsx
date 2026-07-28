import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ListingCard } from './components/ListingCard'
import { CategoryCard } from './components/CategoryCard'
import { LeadGenCTA } from './components/LeadGenCTA'
import { HeroSearch } from './components/HeroSearch'
import { TrustStrip } from './components/TrustStrip'
import { ChecklistOptin } from './components/ChecklistOptin'
import { FAQ } from './components/FAQ'
import { getAllPosts } from '@/lib/blog'
import { LISTING_CARD_COLUMNS, type ListingCardData, type Category } from '@/lib/types'

export const metadata: Metadata = {
  title: 'LegalAIMCP — AI Integrations for Law Firms',
  description:
    'The curated directory of AI-powered MCP integrations for law firms. Find tools for contract review, case management, legal research, client intake, and more.',
  alternates: { canonical: 'https://legalaimcp.com' },
}

// Pricing-tier sort key for the Featured grid — implements CRO rule #10
// (price anchoring): show higher-priced options first so freemium/free reads
// as relief, not as "is this serious?"
const PRICING_ANCHOR_ORDER: Record<string, number> = {
  contact: 0,
  paid: 1,
  freemium: 2,
  free: 3,
}

export default async function HomePage() {
  const [featuredListings, categories, countData] = supabase
    ? await Promise.all([
        supabase
          .from('listings')
          .select(LISTING_CARD_COLUMNS) // Q3: card columns only — no description
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

  // Sort Featured tools by price anchor (high → low) so visitor brain anchors
  // on the expensive options before reaching the free ones. CRO rule #10.
  const typedListings = ((featuredListings ?? []) as ListingCardData[]).slice().sort(
    (a, b) =>
      (PRICING_ANCHOR_ORDER[a.pricing_model] ?? 99) -
      (PRICING_ANCHOR_ORDER[b.pricing_model] ?? 99),
  )
  const typedCategories = (categories ?? []) as Category[]
  const totalTools = countData?.length ?? 0
  const recentPosts = getAllPosts().slice(0, 3)

  return (
    <main>
      {/* ── 1. Hero ── Keeps the existing redesign (HeroSearch + stats bar). */}
      <section className="bg-gradient-to-b from-navy to-[#1E293B] text-white py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block bg-white/10 border border-white/20 text-white/80 text-xs font-sans font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            The MCP Directory for Legal
          </span>
          <h1 className="font-display text-5xl sm:text-6xl font-bold leading-tight">
            Connect AI to your<br />law firm&apos;s tools.
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mt-5 font-body leading-relaxed">
            Find MCP integrations that plug AI directly into your case management,
            document review, legal research, and billing workflows — no IT department needed.
          </p>

          <HeroSearch />

          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <Link
              href="/servers"
              className="bg-white text-navy font-sans font-semibold px-6 py-3 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Browse All Tools →
            </Link>
            <Link
              href="/submit"
              className="border border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-lg font-sans font-semibold transition-colors"
            >
              Submit a Tool
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mt-10 flex flex-wrap gap-6 justify-center text-sm text-slate-400 font-body">
            <span>{totalTools > 0 ? `${totalTools}+` : '18+'} tools listed</span>
            <span className="text-slate-600">·</span>
            <span>7 practice categories</span>
            <span className="text-slate-600">·</span>
            <span>No paid placements</span>
            <span className="text-slate-600">·</span>
            <span>Free to browse</span>
          </div>
        </div>
      </section>

      {/* ── 2. Trust strip ── CRO #6/#7/#11 — clustered trust signals
          immediately under the primary CTA. Complements the hero stats bar
          with the differentiation claims (who operates it, how links stay
          honest) that the stats bar doesn't cover. */}
      <TrustStrip />

      {/* ── 3. How It Works ── */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text text-center mb-2">
            How it works
          </p>
          <h2 className="font-display text-3xl font-bold text-navy text-center">
            AI that actually knows your practice
          </h2>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-navy/5 flex items-center justify-center mx-auto mb-4">
                <span className="font-display text-2xl font-bold text-navy">1</span>
              </div>
              <h3 className="font-sans font-semibold text-navy text-lg mb-2">Find the right tool</h3>
              <p className="font-body text-charcoal/60 text-sm leading-relaxed">
                Browse by practice area — contract review, legal research, client intake,
                billing, and more. New submissions are reviewed before they go
                live, and published links are re-checked automatically.
              </p>
            </div>
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-navy/5 flex items-center justify-center mx-auto mb-4">
                <span className="font-display text-2xl font-bold text-navy">2</span>
              </div>
              <h3 className="font-sans font-semibold text-navy text-lg mb-2">Connect in minutes</h3>
              <p className="font-body text-charcoal/60 text-sm leading-relaxed">
                MCP integrations plug directly into Claude, ChatGPT, or your existing AI
                assistant. No IT team, no long implementations, no custom code.
              </p>
            </div>
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-navy/5 flex items-center justify-center mx-auto mb-4">
                <span className="font-display text-2xl font-bold text-navy">3</span>
              </div>
              <h3 className="font-sans font-semibold text-navy text-lg mb-2">Let AI handle the rote work</h3>
              <p className="font-body text-charcoal/60 text-sm leading-relaxed">
                Research, drafting, intake, and deadline tracking run in the background while
                you focus on the work that actually requires a lawyer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Featured Listings ── Now sorted by price anchor (CRO #10). */}
      <section className="section-padding bg-warm-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-2">
                Featured
              </p>
              <h2 className="font-display text-3xl font-bold text-navy">
                Handpicked AI integrations
              </h2>
            </div>
            <Link
              href="/servers"
              className="font-sans text-sm font-semibold text-gold-text hover:underline hidden sm:block"
            >
              View all →
            </Link>
          </div>

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

          <div className="mt-8 sm:hidden">
            <Link href="/servers" className="text-gold-text font-sans font-semibold text-sm hover:underline">
              View all tools →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. Categories ── */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-navy text-center">
            Browse by practice area
          </h2>
          <p className="text-center text-charcoal/60 font-body mt-2 text-base">
            Tools organized by how lawyers actually work.
          </p>

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

      {/* ── 6. Lead magnet (email capture) ──
          The new primary first ask. CRO #13 lead-magnet hierarchy (template /
          checklist > guide), #23 micro-commitment ladder (single field).
          Positioned AFTER visitors have seen the directory + categories,
          BEFORE the deeper MCP explainer — they've seen enough to know what's
          on offer; the checklist is the natural next step for the
          consideration-stage visitor. */}
      <section className="section-padding bg-gradient-to-b from-white to-warm-white">
        <div className="max-w-7xl mx-auto px-6">
          <ChecklistOptin source="homepage_checklist" variant="hero" />
        </div>
      </section>

      {/* ── 7. What is MCP? ── */}
      <section className="section-padding bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-3">
                The technology
              </p>
              <h2 className="font-display text-3xl font-bold text-navy">
                What is MCP?
              </h2>
              <p className="font-body text-lg text-charcoal/80 mt-5 leading-relaxed">
                Model Context Protocol (MCP) is an open standard created by Anthropic that lets
                AI assistants connect directly to your existing tools — case management, document
                storage, billing software, and more.
              </p>
              <p className="font-body text-charcoal/70 mt-4 leading-relaxed">
                Think of it as USB-C for AI. Instead of copying data between systems, MCP lets
                your AI read, search, and act on your data in real time — through secure,
                permission-controlled connections. The AI comes to your data. Not the other way around.
              </p>
              <Link
                href="/blog/what-is-mcp-for-law-firms"
                className="text-gold-text font-sans font-semibold inline-block mt-6 hover:underline"
              >
                Read the full explainer →
              </Link>
            </div>

            {/* Comparison callout */}
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                <p className="font-sans font-semibold text-red-800 text-sm mb-2">Without MCP</p>
                <p className="font-body text-red-700 text-sm leading-relaxed">
                  Copy text into ChatGPT → get a response → manually paste into your case system →
                  repeat 40 times a day.
                </p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                <p className="font-sans font-semibold text-green-800 text-sm mb-2">With MCP</p>
                <p className="font-body text-green-700 text-sm leading-relaxed">
                  Ask your AI assistant a question. It reads your case files, searches case law,
                  and drafts the memo — in one step.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Recent Blog Posts ── */}
      {recentPosts.length > 0 && (
        <section className="section-padding bg-warm-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-2">
                  From the blog
                </p>
                <h2 className="font-display text-3xl font-bold text-navy">
                  Legal AI insights
                </h2>
              </div>
              <Link
                href="/blog"
                className="font-sans text-sm font-semibold text-gold-text hover:underline hidden sm:block"
              >
                All articles →
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {recentPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="card-bordered group hover:border-navy/20 transition-colors block"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-slate-100 text-charcoal rounded-full px-2.5 py-1 font-sans">
                      {post.category}
                    </span>
                    <span className="text-xs text-charcoal/40 font-body">{post.readingTime}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-navy group-hover:text-gold-text transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <p className="font-body text-charcoal/60 text-sm mt-2 leading-relaxed line-clamp-2">
                    {post.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 9. FAQ ── CRO #14 objection preemption. Sits BEFORE the
          consultation CTA so skeptical visitors get their hard questions
          answered before being asked to spend 30 minutes on a call. */}
      <FAQ />

      {/* ── 10. Lead Gen CTA ── */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <LeadGenCTA />
        </div>
      </section>
    </main>
  )
}
