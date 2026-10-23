import Link from 'next/link'
import { SOFTWARE_CONNECTIONS, getSoftwareConnection } from '@/lib/connections'

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
        <p className="font-sans text-xs text-slate-300">{kindLabel[connection.kind]}</p>
        <h2 id="connection-heading" className="scroll-mt-24 font-display text-2xl mt-2">Connect {connection.name} to your AI assistant</h2>
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
      <div className="border-t border-slate-200 bg-slate-50 p-6 font-body text-sm">
        <a href={connection.source} target="_blank" rel="noopener noreferrer" className="text-gold-text font-semibold underline">{connection.sourceLabel} ↗</a>
        <p className="text-charcoal/75 mt-2">Documentation reviewed <time dateTime={connection.reviewed}>October 19, 2026</time>. Setup has not been tested against a customer account. Start with fictional data and check the vendor&apos;s current requirements.</p>
      </div>
    </section>
  )
}

export function SoftwareConnectionShortlist() {
  return (
    <section id="connections" aria-labelledby="connections-heading" className="scroll-mt-24 mb-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-8">
      <p className="font-sans text-xs font-bold text-gold-text">Software connections</p>
      <h2 id="connections-heading" className="font-display text-2xl font-bold text-navy mt-2">Start with a documented setup path</h2>
      <p className="font-body text-sm text-charcoal/80 mt-3 max-w-3xl">Choose the software you use to see requirements, permissions and source documentation. These are reviewed setup references, not security audits or proof that your account is connected.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
        {SOFTWARE_CONNECTIONS.map(connection => (
          <Link key={connection.name} href={`/servers/${connection.slugs[0]}#connection-heading`} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-navy/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy">
            <span className="block font-sans font-semibold text-navy">{connection.name}</span>
            <span className="block text-xs text-gold-text mt-2">{kindLabel[connection.kind]}</span>
            <span className="block font-body text-sm text-charcoal/80 mt-2">{connection.workflow}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
