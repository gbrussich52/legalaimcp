import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbJsonLd, FAQJsonLd } from '@/app/components/JsonLd'
import { withSocial } from '@/lib/seo-meta'
import { toJsonLd } from '@/lib/json-ld'
import { SITE_NAME, SITE_URL } from '@/lib/constants'
import {
  IMANAGE_ADMIN_STEPS,
  IMANAGE_CLAUDE_STEPS,
  IMANAGE_CONNECTORS,
  IMANAGE_GUIDE_CHECKED,
  IMANAGE_GUIDE_FAQS,
  IMANAGE_GUIDE_LEAD,
  IMANAGE_GUIDE_SOURCES,
  IMANAGE_WORK_READ_TOOLS,
  IMANAGE_WORK_WRITE_TOOLS,
} from '@/lib/imanage-guide'

// Grok Bot (Crack Bot), 2026-11-27, why: a step-by-step page for "connect claude to imanage" / "imanage mcp setup".
// All copy lives in lib/imanage-guide.ts with its sources; the listing page /servers/imanage-work keeps its own FAQ.
const PATH = '/guides/connect-claude-to-imanage'
const H1 = 'Connect Claude to iManage Work: MCP Setup'

const baseMetadata: Metadata = {
  title: 'Connect Claude to iManage Work: MCP Setup',
  description: 'How to connect Claude to iManage Work: the Control Center setup, the connector steps, the iManage MCP URLs, and which tools Claude gets.',
  alternates: { canonical: `${SITE_URL}${PATH}` },
}

const h2 = 'font-display text-2xl font-bold text-navy scroll-mt-24'
const link = 'text-gold-text underline'

const article = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: H1,
  description: baseMetadata.description,
  mainEntityOfPage: `${SITE_URL}${PATH}`,
  datePublished: IMANAGE_GUIDE_CHECKED,
  dateModified: IMANAGE_GUIDE_CHECKED,
  publisher: { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL },
}

export default function Guide() {
  return (
    <main className="section-padding">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(article) }} />
      <BreadcrumbJsonLd items={[{ name: 'Home', path: '/' }, { name: 'Browse tools', path: '/servers' }, { name: 'Connect Claude to iManage Work', path: PATH }]} />
      <FAQJsonLd faqs={IMANAGE_GUIDE_FAQS} />
      <div className="max-w-content mx-auto">
        <nav aria-label="Breadcrumb" className="text-sm font-body text-charcoal/80 mb-8"><Link href="/" className="underline">Home</Link> / <Link href="/servers" className="underline">Browse tools</Link> / Connect Claude to iManage Work</nav>
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text">Source-backed setup reference</p>
        <h1 className="font-display text-4xl font-bold text-navy mt-3">{H1}</h1>
        <p className="font-body text-lg text-charcoal/80 leading-relaxed mt-4">{IMANAGE_GUIDE_LEAD}</p>
        <p className="font-body text-sm text-charcoal/80 mt-3">From iManage’s own help pages, read {IMANAGE_GUIDE_CHECKED}. We have not connected a firm account ourselves. LegalAIMCP is a directory, not iManage, and this is not legal advice.</p>

        <div className="space-y-10 mt-10 font-body text-charcoal/80 leading-relaxed">
          <section aria-labelledby="admin">
            <h2 id="admin" className={h2}>Step 1: the iManage administrator’s part</h2>
            <p className="mt-3">This is done once for the firm, in iManage Control Center. If the two applications are already there, skip to step 2. To change the MCP Control Center Extension, the administrator must be in the NRTADMIN group. If the applications do not show up in the search, the tenant administrator has to enable them.</p>
            <ol className="list-decimal pl-6 mt-3 space-y-2">
              {IMANAGE_ADMIN_STEPS.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </section>

          <section aria-labelledby="claude">
            <h2 id="claude" className={h2}>Step 2: connect iManage Work in Claude</h2>
            <ol className="list-decimal pl-6 mt-3 space-y-2">
              {IMANAGE_CLAUDE_STEPS.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </section>

          <section aria-labelledby="urls">
            <h2 id="urls" className={h2}>The iManage MCP URLs for custom connectors</h2>
            <p className="mt-3">You can also add an iManage connector by URL as a custom connector. iManage says this needs a paid Claude subscription, and it points to Claude’s own documentation for the current steps. iManage lists these addresses:</p>
            <dl className="mt-4 space-y-4">
              {IMANAGE_CONNECTORS.map((c) => (
                <div key={c.name}>
                  <dt className="font-sans font-semibold text-navy">{c.name}</dt>
                  <dd className="mt-1">{c.use} <code className="block bg-slate-100 rounded px-3 py-2 mt-1 font-mono text-xs text-charcoal break-all select-all">{c.url}</code></dd>
                </div>
              ))}
            </dl>
            <p className="mt-3">If your firm has a custom iManage subdomain, add it in front of cloudimanage with a dot. iManage’s example: a firm with the subdomain ajubalaw uses https://ajubalaw.cloudimanage.com/mcp/work. Sign in with your iManage credentials when asked, and repeat for each connector you want.</p>
          </section>

          <section aria-labelledby="tools">
            <h2 id="tools" className={h2}>What Claude can do once connected</h2>
            <p className="mt-3">Only read tools are available by default. Your administrator decides which tools each MCP client may use. iManage documents these tools for the iManage Work connector:</p>
            <p className="mt-3"><strong className="text-navy">Read:</strong> <span className="font-mono text-sm">{IMANAGE_WORK_READ_TOOLS.join(', ')}</span>.</p>
            <p className="mt-3"><strong className="text-navy">Write:</strong> <span className="font-mono text-sm">{IMANAGE_WORK_WRITE_TOOLS.join(', ')}</span>. These create workspaces and folders, change profiles, and move or upload documents, so read the authorization screen before you grant more than read access.</p>
            <p className="mt-3">Two limits apply. iManage MCP Server reads up to 1 million characters of each document or email; for an email, that covers the email and its attachments together, so an attachment may be cut off or missing. Some search and list tools return at most 500 results, 100 to a page by default.</p>
          </section>

          <section aria-labelledby="other-clients">
            <h2 id="other-clients" className={h2}>ChatGPT and Microsoft Copilot Studio</h2>
            <p className="mt-3">iManage says its connectors work with any MCP-enabled client and publishes steps for Claude, ChatGPT and Microsoft Copilot Studio. In ChatGPT, iManage Work is installed from Plugins; Search, Insight+ and Tracker are custom connectors only, which need Developer mode. ChatGPT does not refresh a custom connector’s tools by itself; use Refresh tools in its settings after iManage adds or changes tools.</p>
          </section>

          <section aria-labelledby="before-client-files">
            <h2 id="before-client-files" className={h2}>Before you use client files</h2>
            <p className="mt-3">To open MCP Settings, the administrator must accept an iManage disclaimer that covers the firm’s duties for choosing which AI clients connect, handling data and checking output. Try the connection on documents you are allowed to use for a test, and check your firm’s AI policy and your agreement with the AI provider first.</p>
          </section>

          <section aria-labelledby="faq">
            <h2 id="faq" className={h2}>Questions</h2>
            <dl className="mt-4 space-y-5">
              {IMANAGE_GUIDE_FAQS.map((f) => (
                <div key={f.q}>
                  <dt className="font-sans font-semibold text-navy">{f.q}</dt>
                  <dd className="mt-1">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="sources">
            <h2 id="sources" className={h2}>Sources</h2>
            <p className="mt-3">Read {IMANAGE_GUIDE_CHECKED}. iManage changes these pages; if a step differs, follow iManage.</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              {IMANAGE_GUIDE_SOURCES.map((s) => <li key={s.url}><a href={s.url} className={link} rel="noopener">{s.label}</a></li>)}
            </ul>
          </section>

          <section aria-labelledby="more">
            <h2 id="more" className={h2}>More</h2>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><Link href="/servers/imanage-work" className={link}>iManage Work listing: product details and primary sources</Link></li>
              <li><Link href="/guides/connect-claude-to-clio" className={link}>Connect Claude to Clio</Link></li>
              <li><Link href="/guides/connect-claude-to-harvey" className={link}>Connect Claude to Harvey</Link></li>
              <li><Link href="/guides/connect-claude-to-courtlistener" className={link}>Connect Claude to CourtListener</Link></li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  )
}

export const metadata: Metadata = withSocial(baseMetadata)
