'use client'

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import Link from 'next/link'
import {
  DOCUMENT_CHECK_CLEAN_EXAMPLE,
  DOCUMENT_CHECK_EXAMPLE,
  parseDocumentCheckInput,
  reconcileDocuments,
  type DocumentCheckInput,
  type DocumentCheckResult,
  type ReceivedDocument,
  type RequestedDocument,
} from '@/lib/document-check'
import { useDocumentCheckWebMCP } from './use-document-check-webmcp'

const MAX_REQUESTED = 20
const MAX_RECEIVED = 40
const inputClass = 'mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-navy shadow-sm focus:border-gold-text focus:outline-none focus:ring-2 focus:ring-gold-text/30'
const buttonClass = 'rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-gold-text hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-gold-text/30'

type Draft = {
  uiId: string
  id: string
  name: string
  party: string
  periodStart: string
  periodEnd: string
  version: string
  pages: string
}
type ReceivedDraft = Draft & { requestId: string | null }
type DraftField = Exclude<keyof Draft, 'uiId'>

function emptyDraft(uiId: string, id: string): Draft {
  return { uiId, id, name: '', party: '', periodStart: '', periodEnd: '', version: '', pages: '' }
}

function fromMetadata(metadata: RequestedDocument | ReceivedDocument, uiId: string): Draft {
  return {
    uiId,
    id: metadata.id,
    name: metadata.name,
    party: metadata.party ?? '',
    periodStart: metadata.periodStart ?? '',
    periodEnd: metadata.periodEnd ?? '',
    version: metadata.version === undefined ? '' : String(metadata.version),
    pages: metadata.pages === undefined ? '' : String(metadata.pages),
  }
}

function fromReceived(metadata: ReceivedDocument, uiId: string): ReceivedDraft {
  return { ...fromMetadata(metadata, uiId), requestId: metadata.requestId }
}

function optionalText(value: string): string | undefined {
  return value.trim() === '' ? undefined : value.trim()
}

function validIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function toMetadata(draft: Draft): RequestedDocument {
  const metadata: Record<string, unknown> = { id: draft.id, name: draft.name }
  const party = optionalText(draft.party)
  const periodStart = optionalText(draft.periodStart)
  const periodEnd = optionalText(draft.periodEnd)
  const version = optionalText(draft.version)
  const pages = optionalText(draft.pages)
  if (party !== undefined) metadata.party = party
  if (periodStart !== undefined) metadata.periodStart = periodStart
  if (periodEnd !== undefined) metadata.periodEnd = periodEnd
  if (version !== undefined) metadata.version = /^\d+$/.test(version.trim()) ? Number(version) : version
  if (pages !== undefined) metadata.pages = /^\d+$/.test(pages.trim()) ? Number(pages) : pages
  return metadata as RequestedDocument
}

function toInput(requested: Draft[], received: ReceivedDraft[]): DocumentCheckInput {
  return {
    requested: requested.map(toMetadata),
    received: received.map((draft) => ({ ...toMetadata(draft), requestId: draft.requestId })),
  }
}

function fieldId(prefix: string, rowId: string, field: string): string {
  return `${prefix}-${rowId}-${field}`
}

function MetadataFields({ draft, prefix, labelPrefix, onChange }: { draft: Draft; prefix: string; labelPrefix: string; onChange: (field: DraftField, value: string) => void }) {
  const change = (field: DraftField) => (event: ChangeEvent<HTMLInputElement>) => onChange(field, event.target.value)
  return (
    <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <summary className="cursor-pointer text-sm font-semibold text-navy">Optional metadata</summary>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-charcoal" htmlFor={fieldId(prefix, draft.uiId, 'party')}>{labelPrefix} — Party or owner
          <input id={fieldId(prefix, draft.uiId, 'party')} className={inputClass} value={draft.party} onChange={change('party')} placeholder="Example: Northstar Holdings" maxLength={200} />
        </label>
        <label className="text-sm text-charcoal" htmlFor={fieldId(prefix, draft.uiId, 'periodStart')}>{labelPrefix} — Period start
          <input id={fieldId(prefix, draft.uiId, 'periodStart')} className={inputClass} value={draft.periodStart} onChange={change('periodStart')} placeholder="YYYY-MM-DD" inputMode="numeric" maxLength={10} />
        </label>
        <label className="text-sm text-charcoal" htmlFor={fieldId(prefix, draft.uiId, 'periodEnd')}>{labelPrefix} — Period end
          <input id={fieldId(prefix, draft.uiId, 'periodEnd')} className={inputClass} value={draft.periodEnd} onChange={change('periodEnd')} placeholder="YYYY-MM-DD" inputMode="numeric" maxLength={10} />
        </label>
        <label className="text-sm text-charcoal" htmlFor={fieldId(prefix, draft.uiId, 'version')}>{labelPrefix} — Version number
          <input id={fieldId(prefix, draft.uiId, 'version')} className={inputClass} value={draft.version} onChange={change('version')} placeholder="Example: 2" inputMode="numeric" maxLength={5} />
        </label>
        <label className="text-sm text-charcoal" htmlFor={fieldId(prefix, draft.uiId, 'pages')}>{labelPrefix} — Page count
          <input id={fieldId(prefix, draft.uiId, 'pages')} className={inputClass} value={draft.pages} onChange={change('pages')} placeholder="Example: 14" inputMode="numeric" maxLength={5} />
        </label>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-charcoal/60">Leave fields blank when the checklist does not require them. For received documents, a blank value means unknown and can be flagged when the request expects it. Dates must use YYYY-MM-DD; version and page values must be whole numbers.</p>
    </details>
  )
}

function RequestedRow({ row, index, onChange, onRemove, canRemove }: { row: Draft; index: number; onChange: (field: DraftField, value: string) => void; onRemove: () => void; canRemove: boolean }) {
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-lg font-semibold text-navy">Requested document {index + 1}</h3>
        <button type="button" className="text-sm font-semibold text-gold-text underline focus:outline-none focus:ring-2 focus:ring-gold-text/30 disabled:cursor-not-allowed disabled:text-slate-400" onClick={onRemove} disabled={!canRemove} aria-label={`Remove requested document ${index + 1}`}>Remove</button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-charcoal" htmlFor={fieldId('requested', row.uiId, 'name')}>Requested document {index + 1} — Document name
          <input id={fieldId('requested', row.uiId, 'name')} className={inputClass} value={row.name} onChange={(event) => onChange('name', event.target.value)} placeholder="Executed lease" maxLength={120} aria-required="true" />
        </label>
      </div>
      <MetadataFields draft={row} prefix="requested" labelPrefix={`Requested document ${index + 1}`} onChange={onChange} />
    </li>
  )
}

function ReceivedRow({ row, index, requested, onChange, onRemove, canRemove }: { row: ReceivedDraft; index: number; requested: Draft[]; onChange: (field: DraftField | 'requestId', value: string) => void; onRemove: () => void; canRemove: boolean }) {
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-lg font-semibold text-navy">Received document {index + 1}</h3>
        <button type="button" className="text-sm font-semibold text-gold-text underline focus:outline-none focus:ring-2 focus:ring-gold-text/30 disabled:cursor-not-allowed disabled:text-slate-400" onClick={onRemove} disabled={!canRemove} aria-label={`Remove received document ${index + 1}`}>Remove</button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-charcoal" htmlFor={fieldId('received', row.uiId, 'name')}>Received document {index + 1} — Document name
          <input id={fieldId('received', row.uiId, 'name')} className={inputClass} value={row.name} onChange={(event) => onChange('name', event.target.value)} placeholder="Lease scan" maxLength={120} aria-required="true" />
        </label>
      </div>
      <label className="mt-4 block text-sm font-semibold text-charcoal" htmlFor={fieldId('received', row.uiId, 'requestId')}>Received document {index + 1} — Requested document association
        <select id={fieldId('received', row.uiId, 'requestId')} className={inputClass} value={row.requestId ?? ''} onChange={(event) => onChange('requestId', event.target.value)}>
          <option value="">Unassigned received document</option>
          {requested.map((request, requestIndex) => <option key={request.uiId} value={request.id}>{requestIndex + 1}. {request.name || 'Untitled request'}</option>)}
        </select>
      </label>
      <MetadataFields draft={row} prefix="received" labelPrefix={`Received document ${index + 1}`} onChange={onChange} />
    </li>
  )
}

function statusLabel(status: DocumentCheckResult['items'][number]['status']): string {
  return status === 'matched' ? 'Matched' : status === 'missing' ? 'Missing' : 'Needs review'
}

export default function DocumentCheckForm() {
  const counter = useRef(0)
  const resultRef = useRef<HTMLHeadingElement>(null)
  const nextUiId = (kind: 'requested' | 'received') => { counter.current += 1; return `${kind}-row-${counter.current}` }
  const newRequested = () => { let uiId = nextUiId('requested'); while (requested.some(row => row.id === `requested-new-${counter.current}`)) uiId = nextUiId('requested'); return emptyDraft(uiId, `requested-new-${counter.current}`) }
  const newReceived = () => { let uiId = nextUiId('received'); while (received.some(row => row.id === `received-new-${counter.current}`)) uiId = nextUiId('received'); return fromReceived({ id: `received-new-${counter.current}`, name: '', requestId: null }, uiId) }
  const [requested, setRequested] = useState<Draft[]>(() => DOCUMENT_CHECK_EXAMPLE.requested.map((item, index) => fromMetadata(item, `requested-example-${index + 1}`)))
  const [received, setReceived] = useState<ReceivedDraft[]>(() => DOCUMENT_CHECK_EXAMPLE.received.map((item, index) => fromReceived(item, `received-example-${index + 1}`)))
  const [result, setResult] = useState<DocumentCheckResult | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [agentEnabled, setAgentEnabled] = useState(false)

  const replaceFromAgent = (input: DocumentCheckInput, nextResult: DocumentCheckResult) => {
    setRequested(input.requested.map((item) => fromMetadata(item, nextUiId('requested'))))
    setReceived(input.received.map((item) => fromReceived(item, nextUiId('received'))))
    setResult(nextResult)
    setValidationError(null)
    requestAnimationFrame(() => resultRef.current?.focus())
  }
  const agentStatus = useDocumentCheckWebMCP(agentEnabled, replaceFromAgent)

  function updateRequested(rowId: string, field: DraftField, value: string) {
    setRequested((rows) => rows.map((row) => row.uiId === rowId ? { ...row, [field]: value } : row))
    setResult(null); setValidationError(null)
  }

  function updateReceived(rowId: string, field: DraftField | 'requestId', value: string) {
    setReceived((rows) => rows.map((row) => row.uiId === rowId ? { ...row, [field]: field === 'requestId' ? value || null : value } : row))
    setResult(null); setValidationError(null)
  }

  function removeRequested(rowId: string) {
    const removed = requested.find((row) => row.uiId === rowId)
    setRequested((rows) => rows.length > 1 ? rows.filter((row) => row.uiId !== rowId) : rows)
    if (removed?.id) setReceived((rows) => rows.map((row) => row.requestId === removed.id ? { ...row, requestId: null } : row))
    setResult(null); setValidationError(null)
  }

  function removeReceived(rowId: string) {
    setReceived((rows) => rows.length > 1 ? rows.filter((row) => row.uiId !== rowId) : rows)
    setResult(null); setValidationError(null)
  }

  function addRequested() {
    setRequested((rows) => rows.length < MAX_REQUESTED ? [...rows, newRequested()] : rows)
    setResult(null); setValidationError(null)
  }

  function addReceived() {
    setReceived((rows) => rows.length < MAX_RECEIVED ? [...rows, newReceived()] : rows)
    setResult(null); setValidationError(null)
  }

  function clear() {
    setRequested([newRequested()])
    setReceived([])
    setResult(null); setValidationError(null)
    setAgentEnabled(false)
  }

  function loadExample(example: DocumentCheckInput) {
    setRequested(example.requested.map((item, index) => fromMetadata(item, `requested-example-${index + 1}`)))
    setReceived(example.received.map((item, index) => fromReceived(item, `received-example-${index + 1}`)))
    setResult(null); setValidationError(null)
  }

  function validationHints() {
    const hints: string[] = []
    const rows = [...requested.map((row, index) => ({ row, label: `Requested document ${index + 1}`, isRequested: true })), ...received.map((row, index) => ({ row, label: `Received document ${index + 1}`, isRequested: false }))]
    rows.forEach(({ row, label, isRequested }) => {
      if (row.name.trim() === '') hints.push(`${label}: add a document name.`)
      if (row.name.length > 120) hints.push(`${label}: document name must be 120 characters or fewer.`)
      if (row.party.length > 200) hints.push(`${label}: party or owner must be 200 characters or fewer.`)
      for (const [field, value] of [['version', row.version], ['pages', row.pages] as const]) {
        if (value.trim() !== '' && (!/^\d+$/.test(value.trim()) || Number(value) < 1 || Number(value) > 10000)) hints.push(`${label}: ${field} must be a whole number from 1 to 10,000.`)
      }
      for (const [field, value] of [['period start', row.periodStart], ['period end', row.periodEnd] as const]) {
        if (value.trim() !== '' && !validIsoDate(value.trim())) hints.push(`${label}: ${field} must be a real date in YYYY-MM-DD format.`)
      }
      if (isRequested && Boolean(row.periodStart.trim()) !== Boolean(row.periodEnd.trim())) hints.push(`${label}: enter both period dates or leave both blank.`)
      if (isRequested && row.periodStart.trim() && row.periodEnd.trim() && row.periodStart.trim() > row.periodEnd.trim()) hints.push(`${label}: period start must be on or before period end.`)
    })
    return hints
  }

  function check(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const hints = validationHints()
    if (hints.length > 0) {
      setResult(null)
      setValidationError(`Please correct these fields: ${hints.join(' ')}`)
      return
    }
    try {
      const parsed = parseDocumentCheckInput(toInput(requested, received))
      setResult(reconcileDocuments(parsed))
      setValidationError(null)
      requestAnimationFrame(() => resultRef.current?.focus())
    } catch (error) {
      setResult(null)
      setValidationError(error instanceof Error && error.message ? error.message : 'Please correct the document fields and try again.')
    }
  }

  return (
    <div className="mt-10 space-y-8">
      <form onSubmit={check} autoComplete="off" className="space-y-8">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <span className="w-full text-sm font-semibold text-navy sm:w-auto">Start with a fictional set:</span>
          <button type="submit" className="btn-primary">Check this set →</button>
          <button type="button" className={buttonClass} onClick={() => loadExample(DOCUMENT_CHECK_EXAMPLE)}>Load deficient example</button>
          <button type="button" className={buttonClass} onClick={() => loadExample(DOCUMENT_CHECK_CLEAN_EXAMPLE)}>Load clean example</button>
          <button type="button" className={buttonClass} onClick={clear}>Clear all</button>
        </div>
        <fieldset className="space-y-4">
          <legend className="font-display text-2xl font-semibold text-navy">1. What should be present?</legend>
          <p className="text-sm leading-relaxed text-charcoal/70">Add the documents your fictional checklist expects. Use redacted names and metadata only.</p>
          <ol className="space-y-4">{requested.map((row, index) => <RequestedRow key={row.uiId} row={row} index={index} onChange={(field, value) => updateRequested(row.uiId, field, value)} onRemove={() => removeRequested(row.uiId)} canRemove={requested.length > 1} />)}</ol>
          <button type="button" className={buttonClass} onClick={addRequested} disabled={requested.length >= MAX_REQUESTED}>+ Add requested document</button>
          <p className="text-xs text-charcoal/60">{requested.length} of {MAX_REQUESTED} requested documents</p>
        </fieldset>

        <fieldset className="space-y-4 border-t border-slate-200 pt-8">
          <legend className="font-display text-2xl font-semibold text-navy">2. What arrived?</legend>
          <p className="text-sm leading-relaxed text-charcoal/70">Add what you received and choose the exact requested document for each item. Leave it unassigned when the relationship is unknown.</p>
          {received.length === 0 && <p role="status" className="rounded-lg border border-dashed border-slate-300 px-4 py-5 text-sm text-charcoal/65">No received documents yet. Add one when you have a fictional item to reconcile.</p>}
          <ol className="space-y-4">{received.map((row, index) => <ReceivedRow key={row.uiId} row={row} index={index} requested={requested} onChange={(field, value) => updateReceived(row.uiId, field, value)} onRemove={() => removeReceived(row.uiId)} canRemove />)}</ol>
          <button type="button" className={buttonClass} onClick={addReceived} disabled={received.length >= MAX_RECEIVED}>+ Add received document</button>
          <p className="text-xs text-charcoal/60">{received.length} of {MAX_RECEIVED} received documents</p>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6">
          <button type="submit" className="btn-primary">Check documents →</button>
        </div>
        {validationError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-900">{validationError}</p>}
      </form>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-6" aria-labelledby="agent-heading">
        <h2 id="agent-heading" className="font-display text-xl font-semibold text-navy">Optional browser agent</h2>
        <label className="mt-4 flex items-start gap-3 text-sm font-semibold text-charcoal" htmlFor="enable-browser-agent">
          <input id="enable-browser-agent" type="checkbox" className="mt-1 h-4 w-4 accent-navy" checked={agentEnabled} onChange={(event) => setAgentEnabled(event.target.checked)} />
          <span>Enable my browser agent for this demo<span className="mt-1 block font-normal leading-relaxed text-charcoal/65">An enabled browser agent receives results for the metadata it supplies. It cannot read your existing fields through this tool.</span></span>
        </label>
        <p className="mt-3 text-xs leading-relaxed text-charcoal/60" role="status" aria-live="polite">{agentStatus === 'registered' ? 'Browser agent is enabled for this page.' : agentStatus === 'unavailable' ? 'This browser does not support the optional agent. You can still check documents manually.' : agentStatus === 'error' ? 'The optional browser agent could not be enabled. Manual checking is still available.' : 'Manual checking remains available when the browser agent is disabled.'}</p>
      </section>

      {result && <ResultPanel result={result} received={received} resultRef={resultRef} />}
    </div>
  )
}

function findingLabel(field: string): string {
  return ({ periodStart: 'Period start', periodEnd: 'Period end', period: 'Period', party: 'Party or owner', version: 'Version', pages: 'Page count', requestId: 'Document association' }[field] ?? field)
}

function ResultPanel({ result, received, resultRef }: { result: DocumentCheckResult; received: ReceivedDraft[]; resultRef: React.RefObject<HTMLHeadingElement | null> }) {
  const hasIssues = result.status === 'needs_review'
  const receivedName = (id: string) => {
    const index = received.findIndex((item) => item.id === id)
    return index >= 0 ? `${received[index].name || 'Unnamed received document'} (${index + 1})` : 'Unknown received document'
  }
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 break-words" aria-labelledby="check-result-heading">
      <p className="text-xs font-semibold uppercase tracking-widest text-gold-text">Local check result</p>
      <h2 id="check-result-heading" ref={resultRef} tabIndex={-1} className="mt-3 font-display text-3xl font-bold text-navy focus:outline-none">{hasIssues ? 'Review the document set' : 'No issues found in this set'}</h2>
      <p className="mt-3 text-sm leading-relaxed text-charcoal/70">{hasIssues ? 'The checklist has items that need a person to confirm, correct, or request.' : 'Every requested document has one matching received document with the metadata supplied.'}</p>
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Object.entries({ Requested: result.summary.requested, Received: result.summary.received, Missing: result.summary.missing, 'Needs review': result.summary.needsReview, Matched: result.summary.matched }).map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-charcoal/60">{label}</dt><dd className="mt-1 text-xl font-semibold text-navy">{value}</dd></div>)}
      </dl>
      <ul className="mt-6 space-y-4" aria-label="Requested document findings">
        {result.items.map((item) => <li key={item.requestId} className="border-t border-slate-200 pt-4"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-semibold text-navy min-w-0 max-w-full">{item.name}</h3><span className="text-sm font-semibold text-gold-text">{statusLabel(item.status)}</span></div><p className="mt-1 text-xs text-charcoal/60">Received: {item.receivedIds.length ? item.receivedIds.map(receivedName).join(', ') : 'None'}</p>{item.findings.length > 0 && <ul className="mt-3 space-y-2 text-sm leading-relaxed text-charcoal">{item.findings.map((finding, index) => <li key={`${finding.code}-${finding.field}-${index}`}><span className="font-semibold text-navy">{findingLabel(finding.field)}:</span> {finding.message}</li>)}</ul>}</li>)}
      </ul>
      {result.unassignedIds.length > 0 && <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950"><strong>Unassigned received documents:</strong> {result.unassignedIds.map(receivedName).join(', ')}. Choose a requested document above if the relationship can be confirmed.</p>}
      <div className="mt-6 border-t border-slate-200 pt-5"><h3 className="font-semibold text-navy">Scope of this check</h3><ul className="mt-2 space-y-1 text-xs leading-relaxed text-charcoal/65">{result.limitations.map((limitation) => <li key={limitation}>• {limitation}</li>)}</ul></div>
      <div className="mt-7 rounded-xl bg-navy p-5 text-white"><h3 className="font-display text-xl font-semibold">Need to decide what to fix first?</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">Bring a fictional example to a workflow assessment and scope the review steps, software, and human handoffs.</p><Link href="/workflow-assessment" className="mt-4 inline-block rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white/60">See the workflow assessment →</Link></div>
      <p className="mt-5 text-xs leading-relaxed text-charcoal/60">This browser-only demo checks the metadata you enter. It does not determine legal sufficiency, completeness of a matter, or compliance.</p>
    </section>
  )
}
