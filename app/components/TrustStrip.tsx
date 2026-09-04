import { ShieldCheck, Sparkles, RefreshCw, Eye } from 'lucide-react'

// Trust signals immediately under the hero. Covers CRO rules #6 (social proof),
// #7 (cognitive bias stack — honest sponsored labeling beats a false
// "no paid" claim), and #11 (clustered trust signals near the primary CTA).
//
// Source-of-truth: every claim here must be defensible. We're not claiming
// "trusted by 500 firms" until we have 500 firms to point at. Honest claims
// compound; inflated claims nuke trust permanently (related: rule #9).
//
// 2026-07-28 — this list previously failed its own standard. It claimed
// attorney curation (nobody here is an attorney), a "bar-compliance lens"
// (no such review happens), and weekly updates (content sat ~3 weeks). Nine
// listings pointing at domains that had never existed shipped under those
// claims. Every item below is now something a reader could independently
// check: no listing pays, the operator is named, link checks are a script in
// this repo, and the site takes no money from readers.
const TRUST_ITEMS = [
  {
    icon: Eye,
    label: 'Sponsored Featured labeled',
    detail: 'Paid bumps get a clear badge.',
  },
  {
    icon: ShieldCheck,
    label: 'Built by an AI agency',
    detail: 'NYClaw.io ships these systems.',
  },
  {
    icon: RefreshCw,
    label: 'Links checked automatically',
    detail: 'Dead tools get pulled.',
  },
  {
    icon: Sparkles,
    label: 'Free to browse',
    detail: 'No signup, no paywall.',
  },
] as const

export function TrustStrip() {
  return (
    <section
      className="bg-warm-white border-y border-slate-200"
      aria-label="Why this directory is trustworthy"
    >
      <div className="max-w-7xl mx-auto px-6 py-6">
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {TRUST_ITEMS.map(({ icon: Icon, label, detail }) => (
            <li key={label} className="flex items-start gap-2.5">
              <Icon
                className="w-4 h-4 text-gold-text mt-0.5 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
              <div className="text-left">
                <p className="font-sans text-sm font-semibold text-navy leading-tight">
                  {label}
                </p>
                <p className="font-body text-xs text-charcoal/60 leading-tight mt-0.5">
                  {detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
