import Link from 'next/link'
import { SoftwareConnectionDetails } from './SoftwareConnection'

/** The same reviewed source/permission record drives the guide, listing and MCP. */
export function ReviewedConnectionGuide({ slug, title, lead }: { slug: string; title: string; lead: string }) {
  return <main className="section-padding">
    <div className="max-w-content mx-auto">
      <nav className="text-sm font-body text-charcoal/80 mb-8"><Link href="/servers" className="underline">Browse tools</Link> / Setup reference</nav>
      <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text">Source-backed setup reference</p>
      <h1 className="font-display text-4xl font-bold text-navy mt-3">{title}</h1>
      <p className="font-body text-lg text-charcoal/80 mt-4 mb-8">{lead}</p>
      <SoftwareConnectionDetails slug={slug} />
      <section className="font-body text-charcoal/80 space-y-4">
        <h2 className="font-display text-2xl text-navy">Check one permitted workflow</h2>
        <p>Read the linked vendor or maintainer instructions before installation. Confirm the current client, runtime, account and administrator requirements. This guide intentionally links the source instead of copying an untested installer command.</p>
        <p>Start with fictional or otherwise permitted material. Check source records, requested permissions and which actions can change data. Review the AI provider and connected services as well as the server: MCP does not guarantee that information stays local.</p>
        <p>If authentication, a tool or a result differs from the documentation, stop the test and resolve the difference before using firm data. Public documentation review is separate from a customer-account, security or legal-output test.</p>
        <Link href={`/servers/${slug}`} className="inline-block text-gold-text font-semibold underline">Product details and primary sources →</Link>
      </section>
    </div>
  </main>
}
