import Link from 'next/link'
import { NYCLAW_CONTACT } from '@/lib/constants'

export function LeadGenCTA() {
  return (
    <div className="bg-navy rounded-2xl p-10 text-white">
      <div className="max-w-3xl">
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
          Custom AI for your firm
        </p>
        <h3 className="font-display text-3xl font-bold leading-snug">
          Off-the-shelf tools not quite right?<br />
          We build it for you.
        </h3>
        <p className="font-body text-slate-300 mt-4 text-lg leading-relaxed max-w-xl">
          NYClaw.io builds private MCP integrations tailored to your practice area, case
          management system, and existing workflows. Most firms are operational in under two weeks.
        </p>

        <ul className="mt-6 space-y-2 font-body text-slate-300 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            Works with Clio, MyCase, Filevine, PracticePanther, and custom systems
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            Your data stays in your infrastructure — MCP keeps it private by design
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            Fixed-scope engagements — no open-ended retainers required
          </li>
        </ul>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 items-start">
          <a
            href={NYCLAW_CONTACT}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-navy font-sans font-semibold px-6 py-3 rounded-lg hover:bg-slate-100 transition-colors inline-block"
          >
            Get a Free Consultation →
          </a>
          <Link
            href="/servers"
            className="font-sans font-semibold text-slate-400 hover:text-white transition-colors self-center text-sm"
          >
            Or browse tools first →
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
