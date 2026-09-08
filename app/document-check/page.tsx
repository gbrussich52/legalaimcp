import type { Metadata } from 'next'
import Link from 'next/link'
import DocumentChecker from './checker'

export const metadata: Metadata = {
  title: 'Document Check Demo for Law Firms',
  description: 'Try a fictional document metadata check in your browser, then scope a document workflow pilot with a free fit call.',
  alternates: { canonical: 'https://legalaimcp.com/document-check' },
}

export default function DocumentCheckPage() {
  return (
    <main>
      <section className="bg-gradient-to-b from-navy to-[#1E293B] text-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-display">Document workflow demo</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight mt-4 max-w-3xl">Find missing documents before the next follow-up.</h1>
          <p className="text-xl text-slate-300 max-w-2xl mt-6 leading-relaxed">Enter your checklist and document metadata using fictional or redacted examples. The result points to missing or uncertain details so you can decide whether this is a useful workflow to pilot.</p>
          <div className="mt-8 flex flex-wrap gap-4 items-center">
            <a href="#checker" className="bg-white text-navy font-sans font-semibold px-6 py-3 rounded-lg hover:bg-slate-100 transition-colors">Try the demo ↓</a>
            <Link href="/workflow-assessment" className="border border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-lg font-sans font-semibold transition-colors">Discuss a document-workflow pilot →</Link>
          </div>
          <p className="text-sm text-slate-400 mt-6 max-w-2xl">The preloaded examples are fictional. Use fictional or redacted metadata only. The fields are checked in this browser; no document files are uploaded.</p>
        </div>
      </section>

      <section id="checker" className="bg-warm-white px-6 py-16 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text">Editable metadata</p>
            <h2 className="font-display text-3xl font-bold text-navy mt-3">Check a fictional document set</h2>
            <p className="text-charcoal/70 mt-4 leading-relaxed">Change names, periods, versions, pages, and associations to see how the review list changes. This demo checks metadata only. It does not read files or decide whether a legal document is sufficient.</p>
          </div>
          <section className="mt-8 border border-slate-200 rounded-xl bg-white p-5 sm:p-6" aria-labelledby="example-heading">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text">Before / after · fictional example</p>
            <h2 id="example-heading" className="font-display text-2xl font-bold text-navy mt-2">A small review list can make the next call specific.</h2>
            <div className="grid sm:grid-cols-2 gap-5 mt-5 text-sm">
              <div><p className="font-semibold text-navy">Before</p><p className="mt-1 text-charcoal/70">3 requested records: a deed, a lease, and an identity statement.</p></div>
              <div><p className="font-semibold text-navy">After</p><p className="mt-1 text-charcoal/70">4 received entries: an old deed, two lease copies, and one unassigned scan.</p></div>
            </div>
            <p className="mt-5 text-sm text-charcoal/80 leading-relaxed"><strong>Example result:</strong> 1 missing request (identity statement), 2 requests need review (old deed and duplicate lease), and 1 unassigned scan. The example is fictional; every result still requires staff review.</p>
          </section>
          <div className="mt-8"><DocumentChecker /></div>
        </div>
      </section>

      <section className="bg-white border-t border-slate-200 px-6 py-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          <div><h2 className="font-display text-xl font-bold text-navy">Start with one checklist</h2><p className="mt-3 text-sm text-charcoal/70 leading-relaxed">Choose one repeatable request and define what “ready for review” means to your team.</p></div>
          <div><h2 className="font-display text-xl font-bold text-navy">Keep the examples safe</h2><p className="mt-3 text-sm text-charcoal/70 leading-relaxed">Use redacted or fictional records while you learn where staff judgment is still needed.</p></div>
          <div><h2 className="font-display text-xl font-bold text-navy">Scope the next step</h2><p className="mt-3 text-sm text-charcoal/70 leading-relaxed">Bring the demo result to a free fit call. Any paid scope and fee is agreed in writing first.</p></div>
        </div>
      </section>
    </main>
  )
}
