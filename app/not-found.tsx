import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text">404</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-navy">That page doesn&apos;t exist</h1>
      <p className="mt-3 text-charcoal/75">It may have moved. Here&apos;s where to go next.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          Home
        </Link>
        <Link
          href="/best/legal-mcp-servers"
          className="border border-navy/20 text-navy px-6 py-3 rounded-lg font-sans font-semibold hover:bg-navy/5 transition-colors"
        >
          Best Legal MCP Servers
        </Link>
      </div>
    </main>
  )
}
