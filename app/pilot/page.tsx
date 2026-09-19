import type { Metadata } from 'next'
import Link from 'next/link'
import { PilotForm } from './form'

export const metadata: Metadata = {
  title: 'AI Workflow Reliability Pilot',
  description: 'Scope a four-week pilot to check one legal AI integration, catch empty or stale results, and produce evidence your team can review before sending a request.',
  alternates: { canonical: 'https://legalaimcp.com/pilot' },
}

export default async function PilotPage({ searchParams }: { searchParams: Promise<{ source?: string | string[] }> }) {
  const requestedSource = (await searchParams).source
  const source = requestedSource === 'mcp' || requestedSource === 'workflow_plan' || requestedSource === 'directory' ? requestedSource : 'pilot'
  return (
    <main className="mx-auto max-w-6xl px-5 py-12 font-body sm:px-8 sm:py-16">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-gold-text">For legal teams and AI implementers</p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.12] tracking-tight text-navy sm:text-5xl lg:text-6xl">
          Know when your AI workflow stops delivering.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-charcoal sm:text-xl">
          A connected tool can return empty records, outdated information, or an unexpected answer.
          Define what a useful result looks like, then put repeatable checks around it.
        </p>
        <a href="#prepare-brief" className="mt-7 inline-flex min-h-11 items-center rounded-lg bg-navy px-5 py-3 font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy">
          Prepare your pilot brief <span aria-hidden="true" className="ml-3">↓</span>
        </a>
      </header>

      <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
        <div className="space-y-9">
          <section aria-labelledby="pilot-scope" className="border-t-2 border-navy pt-6">
            <h2 id="pilot-scope" className="font-display text-2xl font-semibold text-navy">A small pilot with a clear scope.</h2>
            <p className="mt-3 leading-relaxed text-charcoal">One integration. Up to five read-only checks. Four weeks to learn which failures are useful to catch.</p>
            <dl className="mt-6 divide-y divide-slate-200 text-sm">
              <div className="flex items-baseline justify-between gap-4 py-3"><dt>Proposed setup fee</dt><dd className="font-semibold text-navy">$250</dd></div>
              <div className="flex items-baseline justify-between gap-4 py-3"><dt>Proposed first month</dt><dd className="font-semibold text-navy">$149</dd></div>
              <div className="flex items-baseline justify-between gap-4 py-3"><dt className="font-semibold text-navy">Proposed pilot total</dt><dd className="text-lg font-semibold text-navy">$399</dd></div>
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-charcoal">We agree the scope, access, check frequency, reporting, and fees before paid work begins. This form does not charge you or start a subscription.</p>
          </section>

          <section aria-labelledby="pilot-delivery">
            <h2 id="pilot-delivery" className="font-display text-2xl font-semibold text-navy">What happens after onboarding</h2>
            <ol className="mt-5 space-y-5">
              {[
                ['Agree the result', 'Use fictional examples to define the records, freshness, or response your team expects. Confirm permissions before a check runs.'],
                ['Run approved checks', 'Automated checks test the agreed behavior on an agreed schedule, with bounded retries for temporary failures.'],
                ['Review the evidence', 'Reports show what passed, what failed, and what needs attention. We assess useful findings and support time before discussing continuation.'],
              ].map(([title, description], index) => (
                <li key={title} className="flex gap-4">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-navy" aria-hidden="true">{index + 1}</span>
                  <div><h3 className="font-semibold text-navy">{title}</h3><p className="mt-1 text-sm leading-relaxed text-charcoal">{description}</p></div>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-sm leading-relaxed text-charcoal">Submitting a request does not activate monitoring. The pilot starts only after the scope and setup are confirmed.</p>
          </section>

          <figure className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <figcaption className="font-display text-xl font-semibold text-navy">A failure worth seeing</figcaption>
            <p className="mt-1 text-xs text-charcoal">Fictional illustration · not a live check</p>
            <dl className="mt-5 space-y-4 text-sm">
              <div><dt className="font-semibold text-navy">Expected</dt><dd className="mt-1 text-charcoal">A test search returns at least one record with a source link.</dd></div>
              <div><dt className="font-semibold text-navy">Observed</dt><dd className="mt-1 text-charcoal">The tool responds successfully, but the result contains no records.</dd></div>
              <div className="border-l-2 border-amber-700 pl-3"><dt className="font-semibold text-amber-900">Needs attention</dt><dd className="mt-1 text-charcoal">The response arrived. The agreed result was missing.</dd></div>
            </dl>
          </figure>

          <section aria-labelledby="pilot-boundaries">
            <h2 id="pilot-boundaries" className="font-display text-xl font-semibold text-navy">Designed for a manageable first step</h2>
            <p className="mt-3 text-sm leading-relaxed text-charcoal">The proposed pilot covers software checks and evidence reports. It excludes legal advice, legal accuracy certification, unlimited fixes, and 24-hour support. It does not make legal decisions or replace your team’s review.</p>
            <p className="mt-3 text-sm leading-relaxed text-charcoal">Workflows that change records, require unavailable access, or need custom setup receive a separate scope review.</p>
            <Link href="/workflow-plan" className="mt-5 inline-block rounded-sm py-2 text-sm font-semibold text-gold-text underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-text">Still choosing a workflow? Build a free plan</Link>
          </section>
        </div>

        <div id="prepare-brief" className="scroll-mt-24"><PilotForm source={source} /></div>
      </div>
    </main>
  )
}
