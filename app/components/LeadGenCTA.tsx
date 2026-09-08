import Link from 'next/link'

export function LeadGenCTA() {
  return (
    <div className="bg-navy rounded-2xl p-10 text-white">
      <div className="max-w-3xl">
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
          A practical next step
        </p>
        <h3 className="font-display text-3xl font-bold leading-snug">
          Pick one workflow.<br />
          Get a plan to improve it.
        </h3>
        <p className="font-body text-slate-300 mt-4 text-lg leading-relaxed max-w-xl">
          NYClaw helps scope one intake, document collection, or billing workflow.
          Start with your existing tools, identify the gaps, and agree a pilot before building.
        </p>

        <ul className="mt-6 space-y-2 font-body text-slate-300 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            Check built-in features and vendor-supported integrations first
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            Map data access and human review before connecting systems
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            Written scope and fee before paid work begins
          </li>
        </ul>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 items-start">
          <Link
            href="/workflow-assessment"
            className="bg-white text-navy font-sans font-semibold px-6 py-3 rounded-lg hover:bg-slate-100 transition-colors inline-block"
          >
            See the workflow assessment →
          </Link>
          <Link
            href="/workflow-plan"
            className="font-sans font-semibold text-slate-400 hover:text-white transition-colors self-center text-sm"
          >
            Build a free plan first →
          </Link>
        </div>

        <p className="mt-5 text-xs text-slate-500 font-body">
          Serving law firms in Westchester County, NYC, and remotely nationwide.
          No commitment required for the initial call.
        </p>
      </div>
    </div>
  )
}
