import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { LeadGenCTA } from '../../components/LeadGenCTA'
import { BreadcrumbJsonLd } from '../../components/JsonLd'
import { SITE_URL } from '@/lib/constants'

/**
 * Setup guide for Harvey MCP. Same live-data contract as the CourtListener
 * guide: name/tagline/pricing/creator come from the Supabase listing row
 * (slug: harvey-mcp) rather than being restated here, so the page cannot
 * drift from the directory.
 *
 * The load-bearing fact on this page is a negative one, and it is deliberate:
 * Harvey publishes no MCP endpoint URL and no install command
 * (developers.harvey.ai/guides/harvey_mcp, checked 2026-08-10). Access is
 * OAuth over Streamable HTTP against a tenant your Harvey admin has to enroll.
 * Search traffic for "harvey mcp" is people hunting for a URL to paste; the
 * useful answer is that there isn't a public one and why. Do not add a
 * fabricated endpoint or `claude mcp add` line here if the listing row is
 * still null — render the enrollment path instead.
 */

const SLUG = 'harvey-mcp'

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

const PAGE_TITLE = 'How to Connect Claude to Harvey AI via MCP (Setup Guide)'
/** Kept under ~160 chars so Google does not truncate it in results. */
const PAGE_DESCRIPTION =
  'Harvey MCP has no public endpoint URL — access is OAuth through admin enrollment. The setup path, the five tools it exposes, and what to check when it fails.'

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/guides/connect-claude-to-harvey` },
  openGraph: { title: PAGE_TITLE, description: PAGE_DESCRIPTION, type: 'article' },
}

/** Tool names as published in Harvey's developer docs, checked 2026-08-10. */
const TOOLS: { name: string; what: string }[] = [
  {
    name: 'ask_harvey',
    what: 'Answers general legal questions from Harvey\'s legal knowledge, without pointing at a specific document.',
  },
  {
    name: 'ask_with_knowledge_source',
    what: 'Runs the same question flow, scoped to a named research database — the UK tax law source, for example.',
  },
  {
    name: 'list_knowledge_sources',
    what: 'Enumerates which research databases your account can reach. Worth calling first; the list is entitlement-dependent.',
  },
  {
    name: 'list_vault_projects',
    what: 'Lists the Vault projects visible to you. Requires the Vault permission on your Harvey role.',
  },
  {
    name: 'ask_about_vault',
    what: 'Answers questions against the documents inside a Vault project, with source citations.',
  },
]

export default async function ConnectHarveyGuidePage() {
  const listing = await getListing()
  if (!listing) notFound()

  const claudeCodeCommand = listing.mcp_install_command
  const docsUrl = listing.external_url ?? 'https://developers.harvey.ai/guides/harvey_mcp'

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Browse Tools', path: '/servers' },
          { name: 'Connect Claude to Harvey', path: '/guides/connect-claude-to-harvey' },
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
            <li aria-current="page" className="text-charcoal">Connect Claude to Harvey</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-10 max-w-3xl">
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-3">
            Setup guide
          </p>
          <h1 className="font-display text-4xl font-bold text-navy leading-tight">
            How to Connect Claude to Harvey AI via MCP
          </h1>
          <p className="font-body text-lg text-charcoal/70 mt-4 leading-relaxed">
            {listing.tagline}. This guide covers what{' '}
            {listing.creator_url ? (
              <a
                href={listing.creator_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-text font-semibold hover:underline"
              >
                {listing.creator_name}
              </a>
            ) : (
              listing.creator_name ?? 'Harvey'
            )}{' '}
            requires before the connection will work, which is the part that most setup
            attempts miss.
          </p>
        </div>

        <div className="max-w-3xl space-y-10">
          {/* The thing people are actually searching for */}
          <section className="rounded-lg border border-gold/40 bg-gold/5 p-6">
            <h2 className="font-display text-2xl font-bold text-navy mb-3">
              First: there is no public endpoint URL
            </h2>
            <p className="font-body text-charcoal/80 leading-relaxed">
              Harvey MCP is not a paste-a-URL server the way{' '}
              <Link href="/guides/connect-claude-to-courtlistener" className="text-gold-text font-semibold hover:underline">
                CourtListener
              </Link>{' '}
              is. Harvey&apos;s developer documentation specifies the transport and the
              authentication method but does not publish a connection URL, and there is
              no <code className="font-mono text-sm">claude mcp add</code> one-liner for it.
              Harvey does not explain the omission, but it fits how the product is gated: access
              is granted per tenant, not published.
            </p>
            <p className="font-body text-charcoal/80 leading-relaxed mt-3">
              The connection is <strong className="text-navy">OAuth over Streamable HTTP</strong>,
              scoped to your firm&apos;s Harvey tenant. Your client authenticates as{' '}
              <em>you</em>, against your firm&apos;s account — so the setup path runs through
              your Harvey admin or representative. There is no config file you can write on your
              own that gets around that.
            </p>
          </section>

          {/* Prerequisites */}
          <section>
            <h2 className="font-display text-2xl font-bold text-navy mb-4">Prerequisites</h2>
            <ul className="space-y-2 font-body text-charcoal/80 leading-relaxed list-disc pl-5">
              <li>An active Harvey account — this is a customer feature, not a free tier</li>
              <li>
                An MCP client that supports <strong className="text-navy">remote servers over
                Streamable HTTP with OAuth</strong>. Claude, Google Gemini, and Microsoft 365
                Copilot are the clients Harvey names. A client that only speaks stdio will not work.
              </li>
              <li>
                Feature enrollment on your tenant. Harvey&apos;s documentation is explicit that
                you should check with your Harvey admin or representative to confirm you are
                enrolled. We expect an unenrolled account to fail at sign-in rather than at
                config time, though we have not tested that directly.
              </li>
              <li>
                Role permissions per tool. Vault tools require the Vault permission on your
                Harvey role, so two users at the same firm can see different tool lists.
              </li>
              {listing.pricing_details && <li>{listing.pricing_details}</li>}
            </ul>
          </section>

          {/* Step 1 */}
          <section>
            <h2 className="font-display text-2xl font-bold text-navy mb-3">
              1. Get your tenant enrolled
            </h2>
            <p className="font-body text-charcoal/70 leading-relaxed">
              Ask your Harvey admin or representative to enable MCP access for your
              account and to confirm which knowledge sources and Vault projects your role can
              reach. Do this before touching any client configuration. Two of the four failures
              listed under Troubleshooting look like client bugs and are not. They are entitlements
              nobody turned on, and no amount of config editing will reach them.
            </p>
          </section>

          {/* Step 2 */}
          <section>
            <h2 className="font-display text-2xl font-bold text-navy mb-3">
              2. Add the server in your client
            </h2>
            {claudeCodeCommand ? (
              <>
                <p className="font-body text-charcoal/70 mb-3 leading-relaxed">
                  Run this in your terminal:
                </p>
                <pre className="bg-navy text-slate-100 rounded-lg p-4 overflow-x-auto text-sm font-mono leading-relaxed">
                  <code>{claudeCodeCommand}</code>
                </pre>
              </>
            ) : (
              <p className="font-body text-charcoal/70 leading-relaxed">
                Harvey supplies the connection details with your enrollment rather than
                publishing them. Use the endpoint your admin or representative gives you, set the
                transport to HTTP, and let the client handle the OAuth handshake. We deliberately
                do not print a URL here — a guessed endpoint fails silently on most clients, which
                is worse than having none. Harvey&apos;s current documentation is at{' '}
                <a
                  href={docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-text font-semibold hover:underline break-all"
                >
                  {docsUrl}
                </a>
                .
              </p>
            )}
          </section>

          {/* Step 3 */}
          <section>
            <h2 className="font-display text-2xl font-bold text-navy mb-3">
              3. Authenticate
            </h2>
            <p className="font-body text-charcoal/70 leading-relaxed">
              The first tool call opens a browser sign-in against your Harvey account. Approve it
              there and the client stores the session. There is no static API key to paste and
              none to rotate. Access follows your Harvey user, so removing someone in Harvey
              removes their route to MCP as well.
            </p>
          </section>

          {/* Step 4 — the tools */}
          <section>
            <h2 className="font-display text-2xl font-bold text-navy mb-3">
              4. The tools you can call
            </h2>
            <p className="font-body text-charcoal/70 mb-4 leading-relaxed">
              Harvey MCP exposes {TOOLS.length} tools. Knowing the names is useful for prompting: you can
              tell Claude which one to reach for instead of hoping it picks correctly.
            </p>
            <dl className="space-y-4">
              {TOOLS.map((tool) => (
                <div key={tool.name}>
                  <dt className="font-mono text-sm font-semibold text-navy">{tool.name}</dt>
                  <dd className="font-body text-charcoal/70 leading-relaxed mt-1">{tool.what}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Step 5 */}
          <section>
            <h2 className="font-display text-2xl font-bold text-navy mb-3">
              5. Test it
            </h2>
            <p className="font-body text-charcoal/70 leading-relaxed">
              Call <code className="font-mono text-sm">list_knowledge_sources</code> first. It is the
              cheapest way to prove the whole chain works — enrollment, OAuth, and tool routing —
              and it returns your entitlements, so you learn what your role can reach at the same
              time. A list of sources means the chain is working. An empty list also means it is
              working, and that your role has no sources attached — an entitlement problem, not a
              connection one.
            </p>
          </section>

          {/* Troubleshooting */}
          <section className="border-t border-slate-200 pt-8">
            <h2 className="font-display text-2xl font-bold text-navy mb-4">Troubleshooting</h2>
            <ul className="space-y-4 font-body text-charcoal/80 leading-relaxed">
              <li>
                <strong className="text-navy">OAuth completes but no tools appear.</strong>{' '}
                Sign-in succeeding only proves the Harvey account exists. It does not prove the
                tenant is enrolled in the MCP feature. It has to be fixed on Harvey&apos;s side;
                no client-side change reaches it.
              </li>
              <li>
                <strong className="text-navy">Vault tools are missing while others work.</strong>{' '}
                Tool visibility is per-role. <code className="font-mono text-sm">list_vault_projects</code>{' '}
                and <code className="font-mono text-sm">ask_about_vault</code> need the Vault
                permission — a colleague seeing them is not evidence your config is wrong.
              </li>
              <li>
                <strong className="text-navy">Client will not connect at all.</strong>{' '}
                Confirm it supports remote MCP over Streamable HTTP with OAuth. Clients that only
                support stdio or API-key headers cannot reach Harvey regardless of configuration.
              </li>
              <li>
                <strong className="text-navy">Nothing happens after editing the config.</strong>{' '}
                Most MCP clients need a full restart, not just closing the window, before they
                pick up a new server entry.
              </li>
            </ul>
          </section>

          {/* Honest comparison — earns the "mcp for lawyers" intent */}
          <section className="border-t border-slate-200 pt-8">
            <h2 className="font-display text-2xl font-bold text-navy mb-4">
              Harvey MCP vs. the open legal servers
            </h2>
            <p className="font-body text-charcoal/70 leading-relaxed">
              Harvey MCP and the open legal servers solve different problems, and a firm can
              reasonably run both. Harvey MCP brings
              your firm&apos;s own Harvey work — Vault documents, licensed research sources — into
              whichever assistant you already use. Because Harvey lists an active Harvey account as a
              prerequisite, there is no way to trial the connector without being a Harvey customer.
            </p>
            <p className="font-body text-charcoal/70 leading-relaxed mt-3">
              The{' '}
              <Link href="/servers/courtlistener-mcp" className="text-gold-text font-semibold hover:underline">
                official CourtListener MCP
              </Link>{' '}
              covers primary source case law and dockets, is free with a CourtListener account, and
              connects with a single command against a published endpoint. If you are testing whether
              MCP is useful in legal work at all, start there — you can do it without a vendor
              conversation, and the failure modes are yours to fix rather than your vendor&apos;s.
              Then see the{' '}
              <Link href="/best/legal-mcp-servers" className="text-gold-text font-semibold hover:underline">
                full roundup of legal MCP servers
              </Link>{' '}
              for what else is available.
            </p>
          </section>

          {/* Sourcing — what is documented vs. what we inferred */}
          <section className="border-t border-slate-200 pt-8">
            <h2 className="font-display text-2xl font-bold text-navy mb-4">
              Sources and what we verified
            </h2>
            <p className="font-body text-charcoal/70 leading-relaxed">
              The transport, the OAuth requirement, the five tool names, the role-based
              permissions, and the enrollment step all come from Harvey&apos;s own
              developer documentation at{' '}
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-text font-semibold hover:underline break-all"
              >
                {docsUrl}
              </a>
              , read on <strong className="text-navy">10 August 2026</strong>. Pricing, tagline,
              and vendor details render live from this site&apos;s directory listing, so they
              change when the listing does.
            </p>
            <p className="font-body text-charcoal/70 leading-relaxed mt-3">
              Two things here are our reading, not Harvey&apos;s words. The first is that the
              absence of a published endpoint is a deliberate access-control decision. Harvey
              documents the OAuth-and-enrollment model but never explains the omission, so we are
              inferring that from how the product is gated. The second is that an unenrolled
              account fails at sign-in. That follows from OAuth running against your firm&apos;s
              tenant, and it matches the order Harvey tells you to work in, but we have not
              reproduced it on an unenrolled account.
            </p>
            <p className="font-body text-charcoal/70 leading-relaxed mt-3">
              Harvey can change any of this without notice. If anything on this page no longer
              matches what you see, Harvey&apos;s documentation is the authority, and we would
              like to hear about it so we can correct the page.
            </p>
          </section>
        </div>

        {/* Related */}
        <section className="mt-14 border-t border-slate-200 pt-10 max-w-3xl">
          <p className="font-body text-charcoal/70">
            See the{' '}
            <Link href={`/servers/${SLUG}`} className="text-gold-text font-semibold hover:underline">
              full Harvey MCP listing
            </Link>{' '}
            for current pricing and details, or the{' '}
            <Link href="/servers/harvey-ai" className="text-gold-text font-semibold hover:underline">
              Harvey AI platform listing
            </Link>{' '}
            if you are evaluating Harvey itself rather than its MCP connector.
          </p>
        </section>

        <div className="mt-14">
          <LeadGenCTA />
        </div>
      </main>
    </>
  )
}
