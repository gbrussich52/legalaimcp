'use client'

// Claude Fable 5.2 (executor), 2026-11-15: one-question exit survey on the cancel page. One click stores an enum; then two plain options. No discount offers.
import { useState } from 'react'
import { CANCEL_REASONS, CANCEL_REASON_LABELS, type CancelReason } from '@/lib/featured-intent'

export function CancelSurvey({ intent, listingName }: { intent: string; listingName: string }) {
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showLink, setShowLink] = useState(false)

  async function choose(reason: CancelReason) {
    setBusy(true)
    try {
      const res = await fetch('/api/featured/cancel-reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent, reason }),
      })
      const data = (await res.json().catch(() => ({}))) as { payment_url?: string | null }
      setPaymentUrl(data.payment_url ?? null)
    } catch {
      // The answer is optional; show the options either way.
    } finally {
      setBusy(false)
      setDone(true)
    }
  }

  async function copy() {
    if (!paymentUrl) return
    try { await navigator.clipboard.writeText(paymentUrl); setCopied(true) } catch { /* the field below is selectable */ }
  }

  const subject = encodeURIComponent(`Question about Featured: ${listingName}`)

  if (!done) {
    return (
      <section className="mb-8" aria-labelledby="stopped-you">
        <h2 id="stopped-you" className="font-display text-xl font-bold text-navy mb-3">What stopped you?</h2>
        <div className="flex flex-col gap-2">
          {CANCEL_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              disabled={busy}
              onClick={() => choose(r)}
              className="border border-slate-200 text-navy px-5 py-2.5 rounded-lg font-sans font-semibold hover:bg-slate-50 disabled:opacity-60"
            >
              {CANCEL_REASON_LABELS[r]}
            </button>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="mb-8 text-left" aria-live="polite">
      <p className="font-body text-charcoal/75 mb-4 text-center">Thanks. That helps.</p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowLink(true)}
          className="border border-slate-200 text-navy px-5 py-2.5 rounded-lg font-sans font-semibold hover:bg-slate-50"
        >
          Send me the payment link to forward
        </button>
        {showLink && (paymentUrl ? (
          <div className="font-body text-sm text-charcoal/80">
            <input readOnly value={paymentUrl} onFocus={(e) => e.currentTarget.select()} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" />
            <button type="button" onClick={copy} className="mt-2 text-gold-text font-semibold hover:underline">
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
        ) : (
          <p className="font-body text-sm text-charcoal/75">
            That payment page has closed. Start again from the listing and the link will be fresh.
          </p>
        ))}
        <a
          href={`mailto:hello@legalaimcp.com?subject=${subject}`}
          className="border border-slate-200 text-navy px-5 py-2.5 rounded-lg font-sans font-semibold hover:bg-slate-50 text-center"
        >
          I have a question
        </a>
      </div>
    </section>
  )
}
