import { ShieldCheck, Sparkles, RefreshCw, Eye } from 'lucide-react'

// Trust signals immediately under the hero. Covers CRO rules #6 (social proof),
// #7 (cognitive bias stack — "no paid placement" leverages skepticism into
// trust), and #11 (clustered trust signals near the primary CTA).
//
// Source-of-truth: every claim here must be defensible. We're not claiming
// "trusted by 500 firms" until we have 500 firms to point at. Honest claims
// compound; inflated claims nuke trust permanently (related: rule #9).
const TRUST_ITEMS = [
  {
    icon: Eye,
    label: 'No paid placements',
    detail: 'Editorial picks only.',
  },
  {
    icon: ShieldCheck,
    label: 'Curated by an attorney',
    detail: 'Built by NYClaw.io.',
  },
  {
    icon: Sparkles,
    label: 'Bar-compliance lens',
    detail: 'Each tool reviewed for risk.',
  },
  {
    icon: RefreshCw,
    label: 'Updated weekly',
    detail: 'New tools, fresh notes.',
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
