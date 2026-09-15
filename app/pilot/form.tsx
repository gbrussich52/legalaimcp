'use client'

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from 'react'
import { buildPilotBrief, pilotSchema, qualifyPilot, type PilotInput, type PilotState } from '@/lib/pilot-intake'
import { submitPilot } from './actions'

const fieldClass = 'mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base font-normal text-navy placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-text focus:ring-offset-1'
const focusClass = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-text'
const primaryClass = `btn-primary ${focusClass} disabled:cursor-wait disabled:opacity-60`
const secondaryClass = `rounded-sm py-3 text-sm font-semibold text-navy underline underline-offset-4 ${focusClass}`
const steps = ['Your workflow', 'Your details', 'Review & send']
const initialState: PilotState = { success: false, error: null }

const emptyDraft = {
  name: '', email: '', organization: '', workflow: '', endpoint: '',
  access: 'not_ready' as PilotInput['access'],
  readOnly: 'unsure' as PilotInput['readOnly'],
  sampleInput: '', expectedResult: '', failureExample: '',
  pricingInterest: 'discuss' as PilotInput['pricingInterest'],
  consent: false, synthetic: false,
}

const accessLabels = { public: 'Public access', authenticated: 'Sign-in or permission required', not_ready: 'Access is not ready / I am not sure' }
const readOnlyLabels = { yes: 'Reads information only', no: 'Can change records or send messages', unsure: 'Needs confirmation' }
const fieldLabels: Record<string, string> = { name: 'Your name', email: 'Contact email', organization: 'Organization', workflow: 'Workflow', sampleInput: 'Fictional input', expectedResult: 'Expected result', failureExample: 'Failure example', endpoint: 'Integration address' }

export function PilotForm({ source = 'pilot' }: { source?: PilotInput['source'] }) {
  const [state, formAction, pending] = useActionState(submitPilot, initialState)
  const [step, setStep] = useState(0)
  const [fields, setFields] = useState(emptyDraft)
  const [requestId, setRequestId] = useState('')
  const [review, setReview] = useState<PilotInput | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [downloadMessage, setDownloadMessage] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const navigated = useRef(false)
  const websiteRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setRequestId(crypto.randomUUID()) }, [])
  useEffect(() => {
    if (navigated.current || state.success) headingRef.current?.focus()
  }, [step, state.success])
  useEffect(() => {
    if (localError || state.error) errorRef.current?.focus()
  }, [localError, state.error])

  function change<K extends keyof typeof emptyDraft>(key: K, value: typeof emptyDraft[K]) {
    setFields((current) => ({ ...current, [key]: value }))
    setLocalError(null)
    setReview(null)
    setDownloadMessage('')
  }

  function move(next: number) {
    navigated.current = true
    setLocalError(null)
    setStep(next)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    if (step === 0) { move(1); return }

    const parsed = pilotSchema.safeParse({ ...fields, requestId, source })
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      const key = String(issue?.path[0] || '')
      navigated.current = true
      setStep(['workflow', 'sampleInput', 'expectedResult', 'failureExample'].includes(key) ? 0 : 1)
      setLocalError(issue ? `${fieldLabels[key] ? `${fieldLabels[key]}: ` : ''}${issue.message}` : 'Please check the details in your request.')
      return
    }
    setReview(parsed.data)
    if (step === 1) { move(2); return }

    const data = new FormData()
    Object.entries(parsed.data).forEach(([key, value]) => data.set(key, String(value)))
    data.set('website', websiteRef.current?.value || '')
    setLocalError(null)
    startTransition(() => formAction(data))
  }

  function downloadBrief() {
    if (!review) return
    try {
      const brief = buildPilotBrief(review)
      const url = URL.createObjectURL(new Blob([brief], { type: 'text/plain;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'legalaimcp-pilot-brief.txt'
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setDownloadMessage('Your brief download is ready. Keep it for your records or share it with your team.')
    } catch {
      setDownloadMessage('The download could not start. Your draft is still here; you can copy the review details below.')
    }
  }

  const qualification = review ? qualifyPilot(review) : null
  const error = localError || state.error

  if (state.success && review) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8" aria-labelledby="pilot-form-title">
        <p className="text-sm font-semibold text-gold-text">Request received</p>
        <h2 id="pilot-form-title" ref={headingRef} tabIndex={-1} className="mt-3 font-display text-3xl font-semibold text-navy focus:outline-none">Your workflow is ready for scope review.</h2>
        <p className="mt-5 leading-relaxed text-charcoal">We received your request and will use <strong className="font-semibold text-navy">{review.email}</strong> to discuss this pilot. We will confirm feasibility, permissions, scope, and fees before work begins.</p>
        {state.receipt && <p className="mt-5 break-all rounded-lg bg-slate-50 p-4 text-sm text-charcoal">Your reference: <span className="font-semibold text-navy">{state.receipt}</span></p>}
        <p className="mt-5 text-sm leading-relaxed text-charcoal">No monitoring or subscription has started, and no payment has been taken. Save your brief for your own records.</p>
        <button type="button" className={`${primaryClass} mt-6`} onClick={downloadBrief}>Download your brief</button>
        <p className="mt-3 text-sm text-charcoal" role="status">{downloadMessage}</p>
        <details className="mt-6 border-t border-slate-200 pt-4">
          <summary className={`cursor-pointer rounded-sm py-2 text-sm font-semibold text-navy ${focusClass}`}>View your pilot brief</summary>
          <pre className="mt-3 whitespace-pre-wrap break-words font-body text-sm leading-relaxed text-charcoal">{buildPilotBrief(review)}</pre>
        </details>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8" aria-labelledby="pilot-form-title">
      <p className="text-sm font-semibold text-gold-text">Prepare your pilot brief</p>
      <h2 id="pilot-form-title" ref={headingRef} tabIndex={-1} className="mt-3 font-display text-3xl font-semibold text-navy focus:outline-none">{step === 0 ? 'Start with one result.' : step === 1 ? 'Help us scope it.' : 'Check your request.'}</h2>
      <p className="mt-3 text-sm leading-relaxed text-charcoal">Your draft stays in this browser tab until you choose “Send pilot request.” You can download it first. Closing or refreshing this page clears an unsent draft.</p>

      <ol className="my-7 flex gap-2 border-b border-slate-200 pb-5" aria-label="Pilot request progress">
        {steps.map((label, index) => (
          <li key={label} aria-current={step === index ? 'step' : undefined} className={`flex-1 text-xs leading-relaxed sm:text-sm ${step === index ? 'font-semibold text-navy' : 'text-charcoal'}`}>
            <span className={`mb-2 block h-1 rounded-full ${index <= step ? 'bg-navy' : 'bg-slate-200'}`} aria-hidden="true" />
            <span className="mr-1">{index + 1}.</span>{label}
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit} aria-busy={pending}>
        <div aria-hidden="true" className="hidden"><label>Website<input ref={websiteRef} name="website" type="text" autoComplete="off" tabIndex={-1} /></label></div>
        {step === 0 && <fieldset className="space-y-5">
          <legend className="sr-only">Your workflow and a fictional example</legend>
          <p className="border-l-2 border-gold-text pl-3 text-sm leading-relaxed text-charcoal">Use fictional examples only. Do not include client names, case details, confidential documents, passwords, or access keys.</p>
          <label htmlFor="pilot-workflow" className="block text-sm font-semibold text-navy">What should your workflow do?
            <textarea id="pilot-workflow" name="workflow" className={fieldClass} required minLength={20} maxLength={1000} rows={3} value={fields.workflow} onChange={(event) => change('workflow', event.target.value)} placeholder="Fictional example: Our research assistant searches a public reference library and returns records with working source links." />
          </label>
          <label htmlFor="pilot-input" className="block text-sm font-semibold text-navy">A fictional input to test
            <textarea id="pilot-input" name="sampleInput" className={fieldClass} required minLength={5} maxLength={600} rows={2} value={fields.sampleInput} onChange={(event) => change('sampleInput', event.target.value)} placeholder="Search the sample library for ‘document retention’." />
          </label>
          <label htmlFor="pilot-expected" className="block text-sm font-semibold text-navy">What would a useful result contain?
            <textarea id="pilot-expected" name="expectedResult" className={fieldClass} required minLength={10} maxLength={600} rows={3} value={fields.expectedResult} onChange={(event) => change('expectedResult', event.target.value)} placeholder="At least one record with a title, a source link, and a publication date." />
          </label>
          <label htmlFor="pilot-failure" className="block text-sm font-semibold text-navy">What failure should we catch?
            <textarea id="pilot-failure" name="failureExample" className={fieldClass} required minLength={10} maxLength={600} rows={3} value={fields.failureExample} onChange={(event) => change('failureExample', event.target.value)} placeholder="The tool says the search succeeded, but it returns an empty list or omits the source links." />
          </label>
          <p className="text-xs leading-relaxed text-charcoal">All four fields are required. Describe software behavior using a made-up example; we do not need an actual matter.</p>
        </fieldset>}

        {step === 1 && <fieldset className="space-y-5">
          <legend className="sr-only">Contact, access, and consent</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <label htmlFor="pilot-name" className="block text-sm font-semibold text-navy">Your name
              <input id="pilot-name" name="name" autoComplete="name" className={fieldClass} required minLength={2} maxLength={80} value={fields.name} onChange={(event) => change('name', event.target.value)} />
            </label>
            <label htmlFor="pilot-organization" className="block text-sm font-semibold text-navy">Organization
              <input id="pilot-organization" name="organization" autoComplete="organization" className={fieldClass} required minLength={2} maxLength={120} value={fields.organization} onChange={(event) => change('organization', event.target.value)} />
            </label>
          </div>
          <label htmlFor="pilot-email" className="block text-sm font-semibold text-navy">Contact email
            <input id="pilot-email" name="email" type="email" autoComplete="email" className={fieldClass} required maxLength={254} value={fields.email} onChange={(event) => change('email', event.target.value)} />
          </label>
          <label htmlFor="pilot-access" className="block text-sm font-semibold text-navy">How is the integration accessed?
            <select id="pilot-access" name="access" className={fieldClass} value={fields.access} onChange={(event) => change('access', event.target.value as PilotInput['access'])}>
              {Object.entries(accessLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label htmlFor="pilot-read-only" className="block text-sm font-semibold text-navy">Does the proposed check only read information?
            <select id="pilot-read-only" name="readOnly" className={fieldClass} value={fields.readOnly} onChange={(event) => change('readOnly', event.target.value as PilotInput['readOnly'])}>
              {Object.entries(readOnlyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <span className="mt-2 block text-xs font-normal leading-relaxed text-charcoal">Read-only checks do not change records, send messages, or make purchases.</span>
          </label>
          <label htmlFor="pilot-endpoint" className="block text-sm font-semibold text-navy">Integration address <span className="font-normal text-charcoal">(optional)</span>
            <input id="pilot-endpoint" name="endpoint" type="url" autoComplete="off" spellCheck={false} className={fieldClass} maxLength={300} value={fields.endpoint} onChange={(event) => change('endpoint', event.target.value)} placeholder="https://example.com/mcp" aria-describedby="pilot-endpoint-help" />
            <span id="pilot-endpoint-help" className="mt-2 block text-xs font-normal leading-relaxed text-charcoal">Leave this blank if you are unsure. Use a public address only, without credentials or access tokens. Submitting it does not authorize a test.</span>
          </label>
          <label htmlFor="pilot-pricing" className="block text-sm font-semibold text-navy">Does the proposed $399 pilot fit your budget?
            <select id="pilot-pricing" name="pricingInterest" className={fieldClass} value={fields.pricingInterest} onChange={(event) => change('pricingInterest', event.target.value as PilotInput['pricingInterest'])}>
              <option value="discuss">I would like to discuss the scope and price</option>
              <option value="yes">Yes, subject to an agreed written scope</option>
            </select>
            <span className="mt-2 block text-xs font-normal leading-relaxed text-charcoal">$250 setup + $149 for the first month. This is an expression of interest, not a purchase.</span>
          </label>
          <div className="space-y-4 border-t border-slate-200 pt-5">
            <label className="flex items-start gap-3 text-sm leading-relaxed text-charcoal"><input className="mt-1 h-4 w-4 shrink-0 accent-navy focus:ring-2 focus:ring-gold-text focus:ring-offset-2" type="checkbox" name="synthetic" value="true" required checked={fields.synthetic} onChange={(event) => change('synthetic', event.target.checked)} /><span>I confirm that these examples are fictional and contain no client or case data, confidential information, or credentials.</span></label>
            <label className="flex items-start gap-3 text-sm leading-relaxed text-charcoal"><input className="mt-1 h-4 w-4 shrink-0 accent-navy focus:ring-2 focus:ring-gold-text focus:ring-offset-2" type="checkbox" name="consent" value="true" required checked={fields.consent} onChange={(event) => change('consent', event.target.checked)} /><span>When I send this request, I agree that LegalAIMCP / NYClaw may store these details to review it and contact me about this pilot. This does not sign me up for a newsletter.</span></label>
            <p className="text-xs leading-relaxed text-charcoal">We store your request privately and use a hashed network identifier to limit spam.</p>
          </div>
        </fieldset>}

        {step === 2 && review && qualification && <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-warm-white p-4">
            <h3 className="font-semibold text-navy">{qualification.fit === 'standard' ? 'Looks suitable for a standard scope review' : 'A few details need a scope review'}</h3>
            <p className="mt-2 text-sm leading-relaxed text-charcoal">This is an automatic fit check based on your answers. Our team has not reviewed the workflow or tested the integration.</p>
            {qualification.reasons.length > 0 && <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-charcoal">{qualification.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
          </div>
          <dl className="space-y-5 text-sm">
            <ReviewItem label="Your workflow" value={review.workflow} />
            <ReviewItem label="Fictional input" value={review.sampleInput} />
            <ReviewItem label="Expected result" value={review.expectedResult} />
            <ReviewItem label="Failure to catch" value={review.failureExample} />
            <ReviewItem label="Contact" value={`${review.name} · ${review.organization}\n${review.email}`} />
            <ReviewItem label="Access and behavior" value={`${accessLabels[review.access]}\n${readOnlyLabels[review.readOnly]}${review.endpoint ? `\n${review.endpoint}` : '\nNo integration address supplied.'}`} />
            <ReviewItem label="Proposed price" value={review.pricingInterest === 'yes' ? '$399 pilot, subject to an agreed written scope.' : 'Discuss the proposed $399 pilot and scope.'} />
          </dl>
          <div className="border-t border-slate-200 pt-5">
            <button type="button" onClick={downloadBrief} className={secondaryClass}>Download brief without sending</button>
            <p role="status" className="text-xs leading-relaxed text-charcoal">{downloadMessage || 'The download is prepared in your browser. Nothing is sent to our team.'}</p>
          </div>
          <p className="text-sm leading-relaxed text-charcoal">Send your brief and contact details for scope review. No charge, subscription, or monitoring starts from this request.</p>
        </div>}

        {error && <p ref={errorRef} tabIndex={-1} role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-900 focus:outline-none">{error} Your draft is still here.{step === 2 ? ' You can download it above and try again later.' : ''}</p>}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
          {step > 0 && <button type="button" className={`${secondaryClass} disabled:opacity-60`} disabled={pending} onClick={() => move(step - 1)}>{step === 2 ? 'Edit details' : 'Back'}</button>}
          <button type="submit" className={`${primaryClass} ${step === 0 ? 'w-full' : 'ml-auto'}`} disabled={pending || !requestId}>{pending ? 'Sending request…' : step === 0 ? 'Continue to details' : step === 1 ? 'Review my brief' : 'Send pilot request'}</button>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-charcoal">{step < 2 ? 'Continue prepares a local draft. Only the final send button submits it.' : 'You have agreed to contact about this request only and confirmed that your examples contain no confidential data.'}</p>
      </form>
      <noscript><p className="mt-5 text-sm text-charcoal">This form needs JavaScript to prepare your brief privately before sending. Enable it to continue.</p></noscript>
    </section>
  )
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-semibold text-navy">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words leading-relaxed text-charcoal">{value}</dd></div>
}
