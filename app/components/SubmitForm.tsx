'use client'

import { useActionState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { submitListing, SubmissionState } from '../submit/actions'
import { CATEGORY_LABELS } from '@/lib/constants'

// ── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Basics' },
  { label: 'Technical' },
  { label: 'About You' },
]

// ── Shared input class ────────────────────────────────────────────────────────
const inputCls =
  'w-full border-2 border-slate-200 rounded-lg px-4 py-3 text-sm font-body focus:outline-none focus:border-gold-text transition-colors'
const labelCls = 'block text-sm font-sans font-medium text-navy mb-1.5'

const initialState: SubmissionState = { success: false, error: null }

export default function SubmitForm() {
  const [state, formAction, isPending] = useActionState(submitListing, initialState)
  const [step, setStep] = React.useState(1)
  const [fields, setFields] = React.useState({
    name: '',
    tagline: '',
    category: 'general',
    external_url: '',
    mcp_repo_url: '',
    mcp_install_command: '',
    pricing_model: 'free',
    pricing_details: '',
    description: '',
    creator_name: '',
    submitter_email: '',
    creator_url: '',
  })
  const [stepErrors, setStepErrors] = React.useState<Record<string, string>>({})

  // ── Success screen ──────────────────────────────────────────────────────────
  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-5 py-16 text-center">
        <CheckCircle2 className="w-14 h-14 text-green-500" strokeWidth={1.5} />
        <h2 className="font-display text-2xl font-bold text-navy">Submission received!</h2>
        <p className="font-body text-charcoal/70 max-w-sm">
          We review every submission within 48 hours. You'll hear from us at the email you provided.
        </p>
        <Link
          href="/servers"
          className="mt-2 text-sm font-sans font-medium text-navy underline underline-offset-4 hover:text-gold-text transition-colors"
        >
          Browse the directory
        </Link>
      </div>
    )
  }

  // ── Step validation ─────────────────────────────────────────────────────────
  function validateStep(s: number): boolean {
    const errs: Record<string, string> = {}

    if (s === 1) {
      if (fields.name.trim().length < 2) errs.name = 'Name must be at least 2 characters.'
      if (fields.tagline.trim().length < 10) errs.tagline = 'Tagline must be at least 10 characters.'
      if (fields.tagline.trim().length > 120) errs.tagline = 'Tagline must be 120 characters or fewer.'
      if (!fields.external_url.trim()) errs.external_url = 'URL is required.'
      else {
        try { new URL(fields.external_url) } catch { errs.external_url = 'Must be a valid URL.' }
      }
    }

    if (s === 2) {
      if (fields.mcp_repo_url && fields.mcp_repo_url.trim()) {
        try { new URL(fields.mcp_repo_url) } catch { errs.mcp_repo_url = 'Must be a valid URL.' }
      }
      if (fields.description.trim().length < 50) errs.description = 'Description must be at least 50 characters.'
      if (fields.description.trim().length > 2000) errs.description = 'Description must be 2000 characters or fewer.'
    }

    if (s === 3) {
      if (fields.creator_name.trim().length < 2) errs.creator_name = 'Name must be at least 2 characters.'
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRe.test(fields.submitter_email)) errs.submitter_email = 'A valid email is required.'
      if (fields.creator_url && fields.creator_url.trim()) {
        try { new URL(fields.creator_url) } catch { errs.creator_url = 'Must be a valid URL.' }
      }
    }

    setStepErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleNext() {
    if (validateStep(step)) setStep((s) => s + 1)
  }

  function handleBack() {
    setStepErrors({})
    setStep((s) => s - 1)
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    // Clear error for this field on change
    if (stepErrors[name]) setStepErrors((prev) => { const next = { ...prev }; delete next[name]; return next })
  }

  // ── Build hidden inputs for all fields so the FormData is complete ──────────
  const hiddenFields = Object.entries(fields).map(([key, val]) => (
    <input key={key} type="hidden" name={key} value={val} />
  ))

  return (
    <form action={formAction}>
      {/* Hidden inputs so all field values are in FormData on submit */}
      {hiddenFields}

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-10">
        {STEPS.map((s, i) => {
          const num = i + 1
          const isActive = num === step
          const isDone = num < step
          return (
            <React.Fragment key={num}>
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-sans font-semibold transition-colors ${
                    isActive
                      ? 'bg-navy text-white'
                      : isDone
                      ? 'bg-navy/20 text-navy'
                      : 'bg-slate-100 text-charcoal/50'
                  }`}
                >
                  {num}
                </span>
                <span
                  className={`text-sm font-sans font-medium hidden sm:block transition-colors ${
                    isActive ? 'text-navy' : isDone ? 'text-navy/60' : 'text-charcoal/40'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${isDone ? 'bg-navy/20' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* ── Step 1: Basics ──────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <div>
            <label className={labelCls} htmlFor="name">Tool Name <span className="text-red-500">*</span></label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={100}
              value={fields.name}
              onChange={handleChange}
              placeholder="e.g. ContractAI"
              className={inputCls}
            />
            {stepErrors.name && <p className="mt-1.5 text-xs text-red-500">{stepErrors.name}</p>}
          </div>

          <div>
            <label className={labelCls} htmlFor="tagline">
              Tagline <span className="text-red-500">*</span>
              <span className="ml-2 font-normal text-charcoal/40">{fields.tagline.length}/120</span>
            </label>
            <input
              id="tagline"
              name="tagline"
              type="text"
              required
              maxLength={120}
              value={fields.tagline}
              onChange={handleChange}
              placeholder="One sentence that sells the tool."
              className={inputCls}
            />
            {stepErrors.tagline && <p className="mt-1.5 text-xs text-red-500">{stepErrors.tagline}</p>}
          </div>

          <div>
            <label className={labelCls} htmlFor="category">Category <span className="text-red-500">*</span></label>
            <select
              id="category"
              name="category"
              value={fields.category}
              onChange={handleChange}
              className={inputCls}
            >
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="external_url">Product URL <span className="text-red-500">*</span></label>
            <input
              id="external_url"
              name="external_url"
              type="url"
              required
              value={fields.external_url}
              onChange={handleChange}
              placeholder="https://yourtool.com"
              className={inputCls}
            />
            {stepErrors.external_url && <p className="mt-1.5 text-xs text-red-500">{stepErrors.external_url}</p>}
          </div>
        </div>
      )}

      {/* ── Step 2: Technical ───────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          <div>
            <label className={labelCls} htmlFor="mcp_repo_url">MCP Repository URL <span className="text-charcoal/40 font-normal">(optional)</span></label>
            <input
              id="mcp_repo_url"
              name="mcp_repo_url"
              type="url"
              value={fields.mcp_repo_url}
              onChange={handleChange}
              placeholder="https://github.com/you/your-mcp-server"
              className={inputCls}
            />
            {stepErrors.mcp_repo_url && <p className="mt-1.5 text-xs text-red-500">{stepErrors.mcp_repo_url}</p>}
          </div>

          <div>
            <label className={labelCls} htmlFor="mcp_install_command">Install Command <span className="text-charcoal/40 font-normal">(optional)</span></label>
            <input
              id="mcp_install_command"
              name="mcp_install_command"
              type="text"
              value={fields.mcp_install_command}
              onChange={handleChange}
              placeholder="npx your-mcp-server"
              className={`${inputCls} font-mono`}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="pricing_model">Pricing Model <span className="text-red-500">*</span></label>
            <select
              id="pricing_model"
              name="pricing_model"
              value={fields.pricing_model}
              onChange={handleChange}
              className={inputCls}
            >
              <option value="free">Free</option>
              <option value="freemium">Freemium</option>
              <option value="paid">Paid</option>
              <option value="contact">Contact for pricing</option>
            </select>
          </div>

          {fields.pricing_model !== 'free' && (
            <div>
              <label className={labelCls} htmlFor="pricing_details">Pricing Details <span className="text-charcoal/40 font-normal">(optional)</span></label>
              <input
                id="pricing_details"
                name="pricing_details"
                type="text"
                value={fields.pricing_details}
                onChange={handleChange}
                placeholder="e.g. $49/mo per seat, free trial available"
                className={inputCls}
              />
            </div>
          )}

          <div>
            <label className={labelCls} htmlFor="description">
              Description <span className="text-red-500">*</span>
              <span className="ml-2 font-normal text-charcoal/40">{fields.description.length}/2000</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              maxLength={2000}
              value={fields.description}
              onChange={handleChange}
              placeholder="Describe what this tool does, who it's for, and what makes it useful for legal professionals. Minimum 50 characters."
              className={`${inputCls} min-h-[120px] resize-y`}
            />
            {stepErrors.description && <p className="mt-1.5 text-xs text-red-500">{stepErrors.description}</p>}
          </div>
        </div>
      )}

      {/* ── Step 3: About You ───────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="flex flex-col gap-6">
          <div>
            <label className={labelCls} htmlFor="creator_name">Your Name <span className="text-red-500">*</span></label>
            <input
              id="creator_name"
              name="creator_name"
              type="text"
              required
              maxLength={100}
              value={fields.creator_name}
              onChange={handleChange}
              placeholder="Jane Smith"
              className={inputCls}
            />
            {stepErrors.creator_name && <p className="mt-1.5 text-xs text-red-500">{stepErrors.creator_name}</p>}
          </div>

          <div>
            <label className={labelCls} htmlFor="submitter_email">Email Address <span className="text-red-500">*</span></label>
            <input
              id="submitter_email"
              name="submitter_email"
              type="email"
              required
              value={fields.submitter_email}
              onChange={handleChange}
              placeholder="jane@yourtool.com"
              className={inputCls}
            />
            {stepErrors.submitter_email && <p className="mt-1.5 text-xs text-red-500">{stepErrors.submitter_email}</p>}
          </div>

          <div>
            <label className={labelCls} htmlFor="creator_url">Your Website <span className="text-charcoal/40 font-normal">(optional)</span></label>
            <input
              id="creator_url"
              name="creator_url"
              type="url"
              value={fields.creator_url}
              onChange={handleChange}
              placeholder="https://yourtool.com/about"
              className={inputCls}
            />
            {stepErrors.creator_url && <p className="mt-1.5 text-xs text-red-500">{stepErrors.creator_url}</p>}
          </div>

          {/* Server-side error */}
          {state.error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {state.error}
            </p>
          )}
        </div>
      )}

      {/* ── Navigation buttons ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="border border-slate-200 text-charcoal font-sans font-medium text-sm px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {step < STEPS.length ? (
          <button
            type="button"
            onClick={handleNext}
            className="btn-primary"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? 'Submitting…' : 'Submit for Review'}
          </button>
        )}
      </div>
    </form>
  )
}

// React must be in scope for JSX — Next.js 15 / React 19 auto-imports it,
// but the explicit import keeps TS happy without relying on that transform.
import React from 'react'
