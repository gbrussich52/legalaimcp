import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { LeadGenCTA } from '../../components/LeadGenCTA'
import { BreadcrumbJsonLd, FAQJsonLd } from '../../components/JsonLd'
import { SITE_URL } from '@/lib/constants'

/**
 * Practical setup guide for the CourtListener MCP server — the "how do I
 * actually connect this" page competitors don't have. All install commands
 * and account/pricing details below come straight from the listing row in
 * Supabase (slug: courtlistener-mcp), not invented — see the fetch in
 * getListing() below. If that row's install command or endpoint ever
 * changes, this page reads it live rather than drifting out of sync.
 */

const SLUG = 'courtlistener-mcp'

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

const PAGE_TITLE = 'How to Connect Claude to CourtListener via MCP (Setup Guide)'
const PAGE_DESCRIPTION =
  "Step-by-step setup for the official CourtListener MCP server: install command, authentication, and how to query millions of court opinions and dockets directly from Claude."

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/guides/connect-claude-to-courtlistener` },
  openGraph: { title: PAGE_TITLE, description: PAGE_DESCRIPTION, type: 'article' },
}

/**
 * FAQPage content — each answer restates a fact already stated in the body
 * copy below (prereqs / troubleshooting sections), never a new claim, so the
 * schema text and the visible text never drift apart.
 */
const FAQS = [
  {
    q: 'Does the CourtListener MCP server require an API key?',
    a: "No. It uses OAuth against your CourtListener account rather than a static API key — the first tool call from your client opens a browser sign-in, and the client stores the resulting session for future calls.",
  },
  {
    q: 'Do I need a paid CourtListener account to use it?',
    a: 'No, a free account is enough to get started. Free accounts have daily query limits; a paid Free Law Project membership raises the ceiling.',
  },
  {
    q: "What do I check if my MCP client can't reach the CourtListener server?",
    a: 'Confirm the transport is set to http and the endpoint is exactly right — a typo in either silently fails on most clients rather than erroring clearly. Also confirm the client was fully restarted after adding the server, since most clients require a restart to pick up a new entry.',
  },
  {
    q: 'Where can I find the current install command for CourtListener MCP?',
    a: 'The full listing at legalaimcp.com/servers/courtlistener-mcp always shows the current install command and pricing details.',
  },
] as const

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-navy text-slate-100 rounded-lg p-4 overflow-x-auto text-sm font-mono leading-relaxed">
      <code>{children}</code>
    </pre>
  )
}

export default async function ConnectCourtListenerGuidePage() {
  const listing = await getListing()
  if (!listing) notFound()

  const claudeCodeCommand = listing.mcp_install_command
  const endpoint = listing.external_url ?? 'https://mcp.courtlistener.com'

  const clientJson = `{
  "mcpServers": {
    "courtlistener": {
      "type": "http",
      "url": "${endpoint}"
    }
  }
}`

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Browse Tools', path: '/servers' },
          { name: 'Connect Claude to CourtListener', path: '/guides/connect-claude-to-courtlistener' },
        ]}
      />
      <FAQJsonLd faqs={FAQS} />

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
            <li aria-current="page" className="text-charcoal">Connect Claude to CourtListener</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-10 max-w-3xl">
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-3">
            Setup guide
          </p>
          <h1 className="font-display text-4xl font-bold text-navy leading-tight">
            How to Connect Claude to CourtListener via MCP
          </h1>
          <p className="font-body text-lg text-charcoal/70 mt-4 leading-relaxed">
            {listing.tagline} This guide walks through connecting{' '}
            {listing.creator_url ? (
              <a
                href={listing.creator_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-text font-semibold hover:underline"
              >
                {listing.creator_name}&apos;s
              </a>
            ) : (
              `${listing.creator_name ?? 'Free Law Project'}'s`
            )}{' '}
            official hosted MCP server to Claude Code, Claude Desktop, or any
            other MCP client.
          </p>
        </div>

        <div className="max-w-3xl space-y-10">
          {/* Prerequisites */}
          <section>
            <h2 className="font-display text-2xl font-bold text-navy mb-4">Prerequisites</h2>
            <ul className="space-y-2 font-body text-charcoal/80 leading-relaxed list-disc pl-5">
              <li>Claude Code, Claude Desktop, or another MCP-compatible client</li>
              <li>A free CourtListener account for OAuth sign-in — no separate API key needed to get started</li>
              {listing.pricing_details && <li>{listing.pricing_details}</li>}
            </ul>
          </section>

          {/* Step 1 */}
          <section>
            <h2 className="font-display text-2xl font-bold text-navy mb-3">
              1. Install: Claude Code
            </h2>
            {claudeCodeCommand ? (
              <>
                <p className="font-body text-charcoal/70 mb-3 leading-relaxed">
                  Run this in your terminal:
                </p>
                <Code>{claudeCodeCommand}</Code>
              </>
            ) : (
              <p className="font-body text-charcoal/70 leading-relaxed">
                See the{' '}
                <Link href={`/servers/${SLUG}`} className="text-gold-text font-semibold hover:underline">
                  full listing
                </Link>{' '}
                for the current install command.
              </p>
            )}
          </section>

          {/* Step 1b */}
          <section>
            <h2 className="font-display text-2xl font-bold text-navy mb-3">
              Or: Claude Desktop, Cursor, and other MCP clients
            </h2>
            <p className="font-body text-charcoal/70 mb-3 leading-relaxed">
              Add this to your client&apos;s MCP configuration file:
            </p>
            <Code>{clientJson}</Code>
          </section>

          {/* Step 2 */}
          <section>
            <h2 className="font-display text-2xl font-bold text-navy mb-3">
              2. Authenticate
            </h2>
            <p className="font-body text-charcoal/70 leading-relaxed">
              The server uses OAuth against your CourtListener account rather
              than a static API key. The first tool call from your client
              triggers a browser sign-in flow — approve it there, and the
              client stores the resulting session for future calls.
            </p>
          </section>

          {/* Step 3 */}
          <section>
            <h2 className="font-display text-2xl font-bold text-navy mb-3">
              3. Test it
            </h2>
            <p className="font-body text-charcoal/70 leading-relaxed">
              Once connected, ask Claude something you&apos;d normally search
              CourtListener for directly — a case name, a circuit split
              question, or a docket lookup. A working connection returns
              cited opinions and docket data in the conversation instead of a
              tool-not-found error.
            </p>
          </section>

          {/* Troubleshooting */}
          <section className="border-t border-slate-200 pt-8">
            <h2 className="font-display text-2xl font-bold text-navy mb-4">Troubleshooting</h2>
            <ul className="space-y-4 font-body text-charcoal/80 leading-relaxed">
              <li>
                <strong className="text-navy">Client can&apos;t reach the server.</strong>{' '}
                Confirm the transport is set to <code className="font-mono text-sm">http</code> and
                the endpoint is exactly{' '}
                <code className="font-mono text-sm break-all">{endpoint}</code> — a typo in
                either silently fails on most clients rather than erroring clearly.
              </li>
              <li>
                <strong className="text-navy">Requests get rate-limited.</strong>{' '}
                Free accounts have daily query limits; a paid Free Law Project
                membership raises the ceiling. This is a CourtListener account
                setting, not a client-side config option.
              </li>
              <li>
                <strong className="text-navy">Nothing happens after adding the config.</strong>{' '}
                Most MCP clients require a full restart (not just closing the
                window) to pick up a new server entry.
              </li>
            </ul>
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
                  <p className="font-body text-charcoal/70 leading-relaxed mt-1">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Related */}
        <section className="mt-14 border-t border-slate-200 pt-10 max-w-3xl">
          <p className="font-body text-charcoal/70">
            See the{' '}
            <Link href={`/servers/${SLUG}`} className="text-gold-text font-semibold hover:underline">
              full CourtListener MCP listing
            </Link>{' '}
            for current pricing and details, or read our analysis of{' '}
            <Link
              href="/blog/courtlistener-mcp-inside-claude"
              className="text-gold-text font-semibold hover:underline"
            >
              what the CourtListener connector means for litigators
            </Link>
            .
          </p>
        </section>

        <div className="mt-14">
          <LeadGenCTA />
        </div>
      </main>
    </>
  )
}
