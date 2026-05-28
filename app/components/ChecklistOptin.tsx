'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Mail } from 'lucide-react'
import { subscribeToChecklist, type SubscribeState } from '../checklist/actions'

const initialState: SubscribeState = { success: false, error: null }

type Props = {
  // Lets us reuse the component on /blog inline opt-ins, etc., while tracking
  // which surface produced the conversion (CRO rule #24).
  source?: string
  // Tonal variants. "hero" = bold dark card on light bg; "inline" = lighter
  // for embedding mid-page.
  variant?: 'hero' | 'inline'
}

export function ChecklistOptin({ source = 'homepage_checklist', variant = 'hero' }: Props) {
  const [state, formAction, isPending] = useActionState(subscribeToChecklist, initialState)

  // Success state — micro-commitment ladder rule #23: the first yes (email)
  // has been earned; now hand them the lead-magnet payload AND tee up the
  // next step (browse tools) while the engagement is hot (rule #17).
  if (state.success) {
    return (
      <div
        className={
          variant === 'hero'
            ? 'rounded-2xl bg-white border-2 border-green-500/30 p-8 max-w-xl mx-auto text-center'
            : 'rounded-xl bg-white border border-green-500/30 p-6 text-center'
        }
      >
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" strokeWidth={1.5} />
        <h3 className="font-display text-2xl font-bold text-navy mt-4">
          Your checklist is ready.
        </h3>
        <p className="font-body text-charcoal/70 mt-2">
          We&apos;ll also email you a copy — but you can read it right now.
        </p>
        <Link
          href="/checklist"
          className="btn-primary inline-block mt-6"
        >
          Open my checklist →
        </Link>
        <p className="text-xs text-charcoal/50 mt-4">
          One email per week. Unsubscribe anytime.
        </p>
      </div>
    )
  }

  const cardCls =
    variant === 'hero'
      ? 'rounded-2xl bg-white border-2 border-navy/10 shadow-lg p-8 max-w-xl mx-auto'
      : 'rounded-xl bg-white border border-slate-200 p-6'

  return (
    <div className={cardCls}>
      {/* Lead-magnet pitch — benefit-first per rule #22 */}
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-gold-text/10 p-2 mt-0.5 shrink-0">
          <Mail className="w-5 h-5 text-gold-text" strokeWidth={2} />
        </div>
        <div>
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text">
            Free Checklist
          </p>
          <h3 className="font-display text-2xl font-bold text-navy mt-1 leading-tight">
            10 questions to ask before adopting any AI tool at your firm.
          </h3>
          <p className="font-body text-charcoal/70 mt-2 text-sm leading-relaxed">
            The one-pager attorneys use to vet AI tools for bar compliance, client data privacy,
            and actual ROI. Skip the demos that waste your week.
          </p>
        </div>
      </div>

      <form action={formAction} className="mt-6 flex flex-col sm:flex-row gap-3">
        <input type="hidden" name="source" value={source} />
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@yourfirm.com"
          aria-label="Email address"
          className="flex-1 border-2 border-slate-200 rounded-lg px-4 py-3 text-sm font-body focus:outline-none focus:border-gold-text transition-colors"
        />
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary disabled:opacity-50 whitespace-nowrap"
        >
          {isPending ? 'Sending…' : 'Send me the checklist →'}
        </button>
      </form>

      {state.error && (
        <p className="mt-3 text-sm text-red-600 font-body" role="alert">
          {state.error}
        </p>
      )}

      {/* Micro-reassurance — covers rule #14 objection preemption inline */}
      <p className="text-xs text-charcoal/50 mt-3 font-body">
        No spam. Unsubscribe anytime. We never sell your email.
      </p>
    </div>
  )
}
