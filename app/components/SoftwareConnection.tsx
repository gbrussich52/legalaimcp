import Link from 'next/link'
import { SOFTWARE_CONNECTIONS, getSoftwareConnection } from '@/lib/connections'
import { FAQJsonLd } from './JsonLd'

const kindLabel = { official: 'Vendor / publisher documented', community: 'Community implementation' }

export function SoftwareConnectionDetails({ slug }: { slug: string }) {
  const connection = getSoftwareConnection(slug)
  if (!connection) return (
    <section className="mb-10 rounded-xl border border-slate-200 bg-slate-50 p-6" aria-labelledby="connection-heading">
      <h2 id="connection-heading" className="scroll-mt-24 font-display text-2xl font-bold text-navy">Connection details</h2>
      <p className="font-body text-charcoal/80 mt-3">No reviewed MCP setup guide is attached to this listing yet. A working website link does not establish a compatible connector.</p>
      <Link href="/servers#connections" className="inline-block mt-3 text-gold-text underline">Explore documented software connections</Link>
    </section>
  )

  return (
    <section className="mb-10 overflow-hidden rounded-xl border border-slate-200" aria-labelledby="connection-heading">
      <div className="bg-navy p-6 text-white">
        <p className="font-sans text-xs uppercase tracking-widest text-slate-300">{kindLabel[connection.kind]}</p>
        <h2 id="connection-heading" className="scroll-mt-24 font-display text-2xl mt-2">Connect {connection.serverName ?? connection.name} to your AI assistant</h2>
        <p className="font-body text-slate-200 mt-3">{connection.workflow}</p>
      </div>
      <dl className="p-6 space-y-5 font-body text-sm leading-relaxed">
        {[
          ['Before you connect', connection.requirements],
          ['Access and permissions', connection.permissions],
          ['Setup path', connection.setup],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="font-sans font-semibold text-navy">{label}</dt>
            <dd className="text-charcoal/80 mt-1 break-words">{value}</dd>
          </div>
        ))}
      </dl>
      {/* Claude Sonnet 5.5, 2026-11-12: a separate vendor-documented connector for the same company,
          labeled as a different product. Source and check date are shown with it. */}
      {connection.vendorConnector && (
        <div className="border-t border-slate-200 p-6 font-body text-sm leading-relaxed" aria-labelledby="vendor-connector-heading">
          <p className="font-sans text-xs uppercase tracking-widest text-gold-text">Vendor / publisher documented</p>
          <h3 id="vendor-connector-heading" className="font-display text-xl text-navy mt-2">{connection.vendorConnector.name}</h3>
          <p className="text-charcoal/80 mt-2">{connection.vendorConnector.summary}</p>
          <p className="text-charcoal/80 mt-3"><span className="font-semibold text-navy">Before you connect: </span>{connection.vendorConnector.requirements}</p>
          <p className="text-charcoal/80 mt-3"><span className="font-semibold text-navy">Access and permissions: </span>{connection.vendorConnector.permissions}</p>
          <p className="mt-3">
            <a href={connection.vendorConnector.source} target="_blank" rel="noopener noreferrer" className="text-gold-text font-semibold underline">{connection.vendorConnector.sourceLabel} ↗</a>
            <span className="text-charcoal/75"> Checked <time dateTime={connection.vendorConnector.reviewed}>{connection.vendorConnector.reviewed}</time>. Not tested against a customer account.</span>
          </p>
        </div>
      )}
      <div className="border-t border-slate-200 bg-slate-50 p-6 font-body text-sm">
        <a href={connection.source} target="_blank" rel="noopener noreferrer" className="text-gold-text font-semibold underline">{connection.sourceLabel} ↗</a>
        <p className="text-charcoal/75 mt-2">Documentation reviewed <time dateTime={connection.reviewed}>{connection.reviewed}</time>. Setup has not been tested against a customer account. Start with fictional data and check the vendor&apos;s current requirements.</p>
      </div>
    </section>
  )
}

export function SoftwareConnectionShortlist() {
  return (
    <section id="connections" aria-labelledby="connections-heading" className="scroll-mt-24 mb-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-8">
      <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text">Software connections</p>
      <h2 id="connections-heading" className="font-display text-2xl font-bold text-navy mt-2">Start with a documented setup path</h2>
      <p className="font-body text-sm text-charcoal/80 mt-3 max-w-3xl">Choose the software you use to see requirements, permissions and source documentation. These are reviewed setup references, not security audits or proof that your account is connected.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
        {SOFTWARE_CONNECTIONS.map(connection => (
          <Link key={connection.name} href={`/servers/${connection.slugs[0]}#connection-heading`} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-navy/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy">
            <span className="block font-sans font-semibold text-navy">{connection.name} →</span>
            <span className="block text-xs text-gold-text mt-2">{kindLabel[connection.kind]}</span>
            <span className="block font-body text-sm text-charcoal/80 mt-2">{connection.workflow}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

/** Claude Sonnet 5.5, 2026-11-12: answer-first paragraph for listing pages that have one (see lib/connections.ts). */
export function ConnectionLead({ slug }: { slug: string }) {
  const lead = getSoftwareConnection(slug)?.lead
  if (!lead) return null
  return <p className="font-body text-lg text-charcoal/80 leading-relaxed max-w-content mb-8">{lead}</p>
}

/**
 * Claude Sonnet 5.5, 2026-11-12: visible FAQ plus FAQPage schema built from the same strings, so the
 * schema text always equals the page text. Listing pages only; guides reuse the connection panel
 * without this block so two URLs do not carry the same FAQ markup.
 */
export function ConnectionFaqs({ slug }: { slug: string }) {
  const connection = getSoftwareConnection(slug)
  if (!connection?.faqs?.length) return null
  return (
    <section className="mb-10 max-w-content" aria-labelledby="connection-faq-heading">
      <FAQJsonLd faqs={connection.faqs} />
      <h2 id="connection-faq-heading" className="font-display text-2xl font-bold text-navy mb-5">Common questions</h2>
      <ul className="space-y-3">
        {connection.faqs.map(({ q, a }) => (
          <li key={q}>
            <details className="group rounded-xl border border-slate-200 bg-white open:bg-warm-white open:border-navy/20 transition-colors">
              <summary className="cursor-pointer list-none px-5 py-4 font-display text-lg font-semibold text-navy flex items-center justify-between gap-4">
                <span>{q}</span>
                <span aria-hidden="true" className="text-2xl text-gold-text group-open:rotate-45 transition-transform leading-none">+</span>
              </summary>
              <div className="px-5 pb-5 font-body text-charcoal/80 leading-relaxed">{a}</div>
            </details>
          </li>
        ))}
      </ul>
      {connection.faqSources && connection.faqsChecked && (
        <p className="font-body text-sm text-charcoal/75 mt-3">
          Checked <time dateTime={connection.faqsChecked}>{connection.faqsChecked}</time> against:{' '}
          {connection.faqSources.map((src, i) => (
            <span key={src.url}>
              {i > 0 && '; '}
              <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-gold-text underline">{src.label} ↗</a>
            </span>
          ))}
          . Not tested against a customer account.
        </p>
      )}
    </section>
  )
}
