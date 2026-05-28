import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ListingCard } from './components/ListingCard'
import { CategoryCard } from './components/CategoryCard'
import { LeadGenCTA } from './components/LeadGenCTA'
import { TrustStrip } from './components/TrustStrip'
import { ChecklistOptin } from './components/ChecklistOptin'
import { FAQ } from './components/FAQ'
import type { Listing, Category } from '@/lib/types'

// SEO copy rewritten to lead with the attorney's outcome (rule #22 benefit-first)
// rather than the directory's feature. The meta description now mirrors the
// rewritten hero subhead — message match (rule #5) for any organic search
// landings.
export const metadata: Metadata = {
  title: 'LegalAIMCP — Vetted AI tools for law firms',
  description:
    'Stop wasting billable hours researching AI tools. A curated directory of MCP integrations for law firms — case management, doc review, research. Find your fit in under 5 minutes.',
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

  // Sort Featured tools by price anchor (high → low) so visitor brain anchors
  // on the expensive options before reaching the free ones. CRO rule #10.
  const typedListings = ((featuredListings ?? []) as Listing[]).slice().sort(
    (a, b) =>
      (PRICING_ANCHOR_ORDER[a.pricing_model] ?? 99) -
      (PRICING_ANCHOR_ORDER[b.pricing_model] ?? 99),
  )
  const typedCategories = (categories ?? []) as Category[]
  const totalListings = countData?.length ?? 0

  return (
    <main>
      {/* ── 1. Hero ──
          CRO rule changes:
          - #1 4-U headline: Useful (saves hours) + Unique (only directory
            built by attorney) + Urgent (every hour you don't switch is billed
            wrong) + Ultra-specific (vetted, MCP, law firms — not "AI tools")
          - #2 Above-fold problem-first: leads with billable-hours pain
          - #19 Grade-6 reading level: short sentences, no jargon-first
          - #22 Benefit-first language: outcome, not feature ("directory")
          - #3 First-person CTA: "Find my tool" beats "Browse Tools"
      */}
      <section className="bg-gradient-to-b from-navy to-[#1E293B] text-white py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-5xl sm:text-6xl font-bold leading-[1.05]">
            Stop wasting billable hours researching AI tools.
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mt-6 font-body leading-relaxed">
            {totalListings > 0
              ? `${totalListings} vetted AI integrations for law firms. Curated by an attorney. No paid placements. Find your fit in under 5 minutes.`
              : 'Vetted AI integrations for law firms. Curated by an attorney. No paid placements. Find your fit in under 5 minutes.'}
          </p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link
              href="/servers"
              className="btn-primary bg-white text-navy hover:bg-slate-100"
            >
              Find my tool →
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

      {/* ── 2. Trust strip ──
          CRO #6 / #7 / #11 — clusters of trust signals immediately under the
          primary CTA, in the visitor's natural F-pattern scan path. */}
      <TrustStrip />

      {/* ── 3. Featured listings — reframed heading + price-anchored sort ──
          CRO #22 benefit-first heading reframe, #10 price anchoring via sort. */}
      <section className="section-padding bg-warm-white">
        <div className="max-w-7xl mx-auto px-6">
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-2">
            Featured
          </p>
          <h2 className="font-display text-3xl font-bold text-navy">
            The tools attorneys ask us about most
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

      {/* ── 4. Categories — reframed heading from "Browse by category" to
          benefit-first "Find the tool for your workflow". Same content, but
          the heading now describes the *job*, not the *navigation pattern*. */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-navy text-center">
            Find the tool for your workflow
          </h2>
          <p className="font-body text-charcoal/60 text-center mt-2 max-w-xl mx-auto">
            Picked by practice area, not vendor logo.
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

      {/* ── 5. Lead magnet (email capture) ──
          The new primary first ask. CRO #13 lead-magnet hierarchy (template /
          checklist > guide), #23 micro-commitment ladder (single field, no
          cold consultation pitch up front). Placed AFTER the visitor has seen
          there are real tools — too early and it feels like a paywall;
          too late and they bounce before opting in. */}
      <section className="section-padding bg-gradient-to-b from-white to-warm-white">
        <div className="max-w-7xl mx-auto px-6">
          <ChecklistOptin source="homepage_checklist" variant="hero" />
        </div>
      </section>

      {/* ── 6. What is MCP? — kept, but condensed.
          The page mixes TOFU and BOFU traffic (rule #20). Visitors who don't
          know MCP need a quick primer; visitors who do need it OUT of the way.
          We strip the section down to a tight one-paragraph explainer with a
          link out to the deep dive on /about. */}
      <section className="section-padding bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-2">
            New to MCP?
          </p>
          <h2 className="font-display text-3xl font-bold text-navy">
            One minute on what MCP actually is.
          </h2>
          <p className="font-body text-lg text-charcoal/80 mt-6 leading-relaxed">
            Model Context Protocol is a standard that lets AI assistants talk
            directly to the software your firm already uses — case management,
            document storage, billing. It&apos;s the adapter that turns ChatGPT-
            style chat into something that actually reads your case files. For
            law firms, that means fewer manual handoffs and AI that knows your
            practice.
          </p>
          <Link
            href="/about"
            className="text-gold-text font-sans font-semibold inline-block mt-6 hover:underline"
          >
            Read the full primer →
          </Link>
        </div>
      </section>

      {/* ── 7. FAQ ── Objection preemption per CRO #14. Sits BEFORE the
          consultation CTA so skeptical visitors get their hard questions
          answered before they're asked to spend 30 minutes on a call. */}
      <FAQ />

      {/* ── 8. Custom-dev CTA ── BOFU pitch for NYClaw consultation, with
          CRO #3 first-person CTA update inside the LeadGenCTA component. */}
      <section className="section-padding bg-warm-white">
        <div className="max-w-7xl mx-auto px-6">
          <LeadGenCTA />
        </div>
      </section>
    </main>
  )
}
