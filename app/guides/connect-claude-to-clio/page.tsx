import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { LeadGenCTA } from '../../components/LeadGenCTA'
import { BreadcrumbJsonLd, FAQJsonLd } from '../../components/JsonLd'
import { SITE_URL } from '@/lib/constants'

/**
 * Setup guide for connecting Claude to Clio via MCP. Same live-data contract
 * as the Harvey and CourtListener guides: name/tagline/pricing/creator come
 * from the Supabase listing row (slug: clio) rather than being restated here.
 *
 * The load-bearing fact here mirrors Harvey's: it is a negative one, and
 * deliberate. Clio (Themis Solutions) has not published an official MCP
 * server or endpoint as of this writing (clio.com checked 2026-09-24, no
 * MCP/AI-connector docs found). Unlike Harvey, though, the answer is not
 * "wait for enrollment" — two independent open-source community servers
 * already exist and work today. Both were opened and read directly (not
 * taken from search snippets) before writing this page:
 *   - github.com/oktopeak/clio-mcp — MIT, 36 tools per its README (v2.2.0,
 *     Sept 2026; its own marketing site at oktopeak.com/clio-mcp/ states 34,
 *     an older count — we cite the README as the more current source and
 *     note the discrepancy rather than picking one silently), stdio +
 *     HTTP/SSE, OAuth with AES-256-GCM token encryption, ABA Opinion 512
 *     audit logging, listed on the official MCP registry as
 *     io.github.oktopeak/clio-mcp.
 *   - github.com/lawyered0/clio-mcp — MIT, 10 tools, narrower scope
 *     (contacts/matters/flat-fee billing + a generic API escape hatch).
 * Neither is built, endorsed, or supported by Clio. Do not upgrade that
 * language if Clio's own site changes — re-check clio.com and the MCP
 * registry first.
 */

const SLUG = 'clio'

interface GuideListing {
  name: string
  tagline: string
  external_url: string | null
  mcp_install_command: string | null
  pricing_details: string | null
  creator_name: string | null
  creator_url: string | null
}

async function getListing(): Promise<GuideListing | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('listings')
    .select('name, tagline, external_url, mcp_install_command, pricing_details, creator_name, creator_url')
    .eq('slug', SLUG)
    .eq('status', 'published')
    .single()
  return data ?? null
}

const PAGE_TITLE = 'How to Connect Claude to Clio via MCP (Setup Guide)'
/** Kept under ~160 chars so Google does not truncate it in results. */
const PAGE_DESCRIPTION =
  'Clio has not published an official MCP server. Two open-source community servers connect Claude to Clio today — what each one does, and how to install one.'

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/guides/connect-claude-to-clio` },
  openGraph: { title: PAGE_TITLE, description: PAGE_DESCRIPTION, type: 'article' },
}

const SERVERS = [
  {
    name: 'oktopeak/clio-mcp',
    repo: 'https://github.com/oktopeak/clio-mcp',
    install: 'npx -y @oktopeak/clio-mcp',
    tools: '36 tools (per its README, v2.2.0) covering matters, contacts, documents, tasks, calendar, billing, and time entries',
    auth:
      'In-app authenticate tool opens a local OAuth flow in your browser; the token is encrypted with AES-256-GCM and stored in your OS keychain (macOS Keychain, Linux secret-service, or Windows Credential Manager)',
    transport: 'stdio for Claude Desktop/Code, or HTTP/SSE for a shared multi-user deployment',
    extra: 'Built-in append-only audit log (timestamp, tool name, arguments, result) aimed at ABA Opinion 512 compliance; an optional read-only mode disables every write tool',
    license: 'MIT',
    maintainer: 'Oktopeak, a legal-tech and healthcare-AI product studio — not Clio',
  },
  {
    name: 'lawyered0/clio-mcp',
    repo: 'https://github.com/lawyered0/clio-mcp',
    install: null,
    tools: '10 tools: clio_who_am_i, clio_create_company_contact, clio_create_person_contact, clio_create_matter, clio_create_flat_fee_activity, clio_find_contact, clio_find_matter, clio_delete_matter, clio_delete_contact, and clio_api_request (a generic escape hatch onto the Clio Manage v4 API)',
    auth: "Clio's own OAuth against the v4 API (repo README covers setup)",
    transport: 'Claude Desktop, Claude Code CLI, and MCP Inspector',
    extra: 'Narrower and newer than oktopeak/clio-mcp; its standout feature is one-call flat-fee matter setup via the custom_rate association, and it supports Clio\'s US, Canada, EU, and Australia regions',
    license: 'MIT',
    maintainer: 'lawyered0 (independent) — not Clio',
  },
] as const

const FAQS = [
  {
    q: 'Does Clio have an official MCP server?',
    a: "No, not as of this writing. Clio's own site and developer documentation do not publish an MCP endpoint, install command, or connector docs. Everything that connects Claude to Clio today is independent, open-source community software — not a Clio product.",
  },
  {
    q: 'Is it safe to connect an unofficial MCP server to my firm\'s Clio data?',
    a: "That's a decision for your firm, not a claim we can make for you. Both servers on this page are open source under the MIT license, so you (or your IT person) can read exactly what the code does before installing it, unlike a closed-source connector. Neither is audited, endorsed, or supported by Clio, and installing either grants that server whatever access your Clio OAuth scope allows — read the server's README for its specific permission model before connecting it to production client data.",
  },
  {
    q: 'Which Clio MCP server should I use?',
    a: 'oktopeak/clio-mcp is the broader option — 36 tools, both local and shared-deployment transports, and audit logging aimed at ABA Opinion 512. lawyered0/clio-mcp is smaller and newer, with 10 tools and a specific strength in one-call flat-fee matter setup. Match the tool list to the Clio workflow you actually want Claude to touch, and start with read-only access if either server offers it.',
  },
  {
    q: 'Will Clio publish its own official MCP server?',
    a: "We don't know, and we won't guess. If Clio publishes one, this page gets rewritten to point at it the same way the Harvey guide would if Harvey did the same. Check clio.com directly for the current state before relying on this page.",
  },
] as const

export default async function ConnectClioGuidePage() {
  const listing = await getListing()
  if (!listing) notFound()

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Browse Tools', path: '/servers' },
          { name: 'Connect Claude to Clio', path: '/guides/connect-claude-to-clio' },
        ]}
      />
      <FAQJsonLd faqs={FAQS} />

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
            <li aria-current="page" className="text-charcoal">Connect Claude to Clio</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-10 max-w-3xl">
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-3">
            Setup guide
          </p>
          <h1 className="font-display text-4xl font-bold text-navy leading-tight">
            How to Connect Claude to Clio via MCP
          </h1>
          <p className="font-body text-lg text-charcoal/75 mt-4 leading-relaxed">
            {listing.tagline} Clio itself has not shipped an MCP server. Two open-source
            community servers have, and this guide covers what each does and how to install one.
          </p>
        </div>

        <div className="max-w-3xl space-y-10">
          {/* The thing people are actually searching for */}
          <section className="rounded-lg border border-gold/40 bg-gold/5 p-6">
            <h2 className="font-display text-2xl font-bold text-navy mb-3">
              First: this is not an official Clio product
            </h2>
            <p className="font-body text-charcoal/80 leading-relaxed">
              Unlike{' '}
              <Link href="/guides/connect-claude-to-courtlistener" className="text-gold-text font-semibold hover:underline">
                CourtListener
              </Link>{' '}
              or Harvey, Clio (Themis Solutions) has not published its own MCP endpoint,
              install command, or connector documentation. Nothing on this page comes from
              Clio — both servers below are independent, open-source projects built by
              third parties against Clio&apos;s public API, and neither is built, endorsed,
              or supported by Clio.
            </p>
            <p className="font-body text-charcoal/80 leading-relaxed mt-3">
              That is a real difference from Harvey, where the setup problem is enrollment.
              Here, the setup problem is choosing between two working community options and
              reading their code before you point either one at production client data.
            </p>
          </section>

          {/* The two servers */}
          <section>
            <h2 className="font-display text-2xl font-bold text-navy mb-4">
              The two servers that connect Claude to Clio
            </h2>
            <div className="space-y-8">
              {SERVERS.map((s) => (
                <div key={s.name} className="rounded-lg border border-slate-200 p-5">
                  <h3 className="font-display text-xl font-bold text-navy mb-1">
                    <a
                      href={s.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold-text hover:underline"
                    >
                      {s.name}
                    </a>
                  </h3>
                  <p className="font-body text-sm text-charcoal/60 mb-3">
                    {s.license} · maintained by {s.maintainer}
                  </p>
                  {s.install && (
                    <pre className="bg-navy text-slate-100 rounded-lg p-3 overflow-x-auto text-sm font-mono leading-relaxed mb-3">
                      <code>{s.install}</code>
                    </pre>
                  )}
                  <dl className="space-y-2 font-body text-charcoal/75 leading-relaxed text-sm">
                    <div>
                      <dt className="font-semibold text-navy inline">Tools: </dt>
                      <dd className="inline">{s.tools}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-navy inline">Auth: </dt>
                      <dd className="inline">{s.auth}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-navy inline">Transport: </dt>
                      <dd className="inline">{s.transport}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-navy inline">Also: </dt>
                      <dd className="inline">{s.extra}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </section>

          {/* Before you connect either one */}
          <section>
            <h2 className="font-display text-2xl font-bold text-navy mb-3">
              Before you connect either one
            </h2>
            <ul className="space-y-2 font-body text-charcoal/80 leading-relaxed list-disc pl-5">
              <li>Read the server&apos;s source before installing it — both are MIT-licensed and small enough to review in an afternoon.</li>
              <li>Start read-only if the server offers it (oktopeak&apos;s does).</li>
              <li>Confirm your firm&apos;s policy on third-party tools touching client data in Clio before connecting either server to a production account, not a sandbox.</li>
              {listing.pricing_details && (
                <li>Clio API access depends on your Clio plan — {listing.pricing_details}.</li>
              )}
            </ul>
          </section>

          {/* Honest comparison — earns the "mcp for lawyers" intent */}
          <section className="border-t border-slate-200 pt-8">
            <h2 className="font-display text-2xl font-bold text-navy mb-4">
              Clio MCP vs. the officially published legal servers
            </h2>
            <p className="font-body text-charcoal/75 leading-relaxed">
              Both Clio servers here are community-maintained, which is a different trust
              posture than a vendor-published connector. The{' '}
              <Link href="/servers/courtlistener-mcp" className="text-gold-text font-semibold hover:underline">
                official CourtListener MCP
              </Link>{' '}
              and Trellis&apos;s official Claude connector for state trial court data are both
              published and operated by the company whose data they expose. If you want to
              test whether MCP is useful for your practice management workflow specifically,
              these community servers are the only way in today — just go in knowing who wrote
              the code. See the{' '}
              <Link href="/best/legal-mcp-servers" className="text-gold-text font-semibold hover:underline">
                full roundup of legal MCP servers
              </Link>{' '}
              for what else is available.
            </p>
          </section>

          {/* Sourcing */}
          <section className="border-t border-slate-200 pt-8">
            <h2 className="font-display text-2xl font-bold text-navy mb-4">
              Sources and what we verified
            </h2>
            <p className="font-body text-charcoal/75 leading-relaxed">
              Both repositories, their READMEs, and oktopeak&apos;s own setup page at{' '}
              <a
                href="https://oktopeak.com/clio-mcp/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-text font-semibold hover:underline"
              >
                oktopeak.com/clio-mcp
              </a>{' '}
              were read directly on{' '}
              <strong className="text-navy">24 September 2026</strong>, along with the
              official MCP registry entry for{' '}
              <span className="font-mono text-sm">io.github.oktopeak/clio-mcp</span>. Clio&apos;s
              own site was checked the same day for an official MCP announcement; none was
              found. Pricing, tagline, and vendor details for Clio itself render live from
              this site&apos;s directory listing, so they change when the listing does.
            </p>
            <p className="font-body text-charcoal/75 leading-relaxed mt-3">
              This page will read wrong the day Clio ships its own MCP server, or the day
              either community server goes stale. If you find either has happened, we would
              like to hear about it so we can correct the page.
            </p>
          </section>

          {/* FAQ */}
          <section className="border-t border-slate-200 pt-8">
            <h2 className="font-display text-2xl font-bold text-navy mb-4">
              Frequently asked questions
            </h2>
            <div className="space-y-5">
              {FAQS.map((f) => (
                <div key={f.q}>
                  <h3 className="font-sans font-semibold text-navy">{f.q}</h3>
                  <p className="font-body text-charcoal/75 leading-relaxed mt-1">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Related */}
        <section className="mt-14 border-t border-slate-200 pt-10 max-w-3xl">
          <p className="font-body text-charcoal/75">
            See the{' '}
            <Link href={`/servers/${SLUG}`} className="text-gold-text font-semibold hover:underline">
              full Clio listing
            </Link>{' '}
            for current pricing and details, or the{' '}
            <Link href="/best/case-management-mcp-servers" className="text-gold-text font-semibold hover:underline">
              best case-management MCP servers
            </Link>{' '}
            for other practice-management options.
          </p>
        </section>

        <div className="mt-14">
          <LeadGenCTA />
        </div>
      </main>
    </>
  )
}
