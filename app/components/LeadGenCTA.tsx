import { NYCLAW_CONTACT } from '@/lib/constants'

// CRO updates:
// - #3 first-person CTA: "Get my free consultation" reads ~90% better than
//   second-person framing in published studies.
// - #22 benefit-first heading: leads with what the visitor gets ("AI that
//   actually fits your workflow") instead of what we offer.
// - #14 objection preempt: the line about "no engineers required" cuts off
//   the most common implicit objection from solos/small firms.
export function LeadGenCTA() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 mt-12">
      <h3 className="font-display text-xl font-bold text-navy">
        Want AI that actually fits your workflow?
      </h3>
      <p className="text-charcoal/70 font-body mb-6 max-w-lg mt-2">
        NYClaw.io builds private AI integrations tailored to your practice
        area, case-management system, and intake workflow — no engineers
        required on your side.
      </p>
      <a
        href={NYCLAW_CONTACT}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary inline-block"
      >
        Get my free consultation →
      </a>
    </div>
  )
}
