import Link from 'next/link'
import { NYCLAW_CONTACT } from '@/lib/constants'

export function LeadGenCTA() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 mt-12">
      <h3 className="font-display text-xl font-bold text-navy">
        Need something custom for your firm?
      </h3>
      <p className="text-charcoal/70 font-body mb-6 max-w-lg mt-2">
        NYClaw.io builds private AI integrations tailored to your practice area, case management
        system, and workflows.
      </p>
      <a href={NYCLAW_CONTACT} target="_blank" rel="noopener noreferrer" className="btn-primary inline-block">
        Get a Free Consultation →
      </a>
    </div>
  )
}
