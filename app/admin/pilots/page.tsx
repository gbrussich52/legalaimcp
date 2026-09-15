// classification: PUBLIC
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getAdminClient } from '@/lib/supabase-admin'
import { PILOT_STATUSES } from '@/lib/pilot-intake'
import { updatePilot } from './actions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pilot requests', robots: { index: false, follow: false } }
type Pilot = { id: string; email: string; payload: Record<string, unknown>; qualification: string; status: string; support_minutes: number | null; created_at: string }
const field = (row: Pilot, key: string) => typeof row.payload?.[key] === 'string' ? row.payload[key] as string : 'Not provided'

export default async function PilotQueue({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login')
  const { result } = await searchParams
  let rows: Pilot[] = []
  let unavailable = false
  try {
    const { data, error } = await getAdminClient().from('pilot_requests')
      .select('id,email,payload,qualification,status,support_minutes,created_at')
      .order('created_at', { ascending: false }).limit(100)
    if (error || !data) unavailable = true
    else rows = data as Pilot[]
  } catch { unavailable = true }
  return <main className="max-w-6xl mx-auto px-6 py-12">
    <Link href="/admin" className="text-gold-text underline">Back to admin</Link>
    <h1 className="font-display text-4xl text-navy mt-5">Pilot requests</h1>
    <p className="mt-3 max-w-3xl">Latest 100 requests, newest first. Scoping never activates monitoring, sends a message or charges a customer. Review permission and fictional good/bad examples before making a check contract.</p>
    {result && <p role="status" className="my-5 p-4 bg-slate-100">{result === 'saved' ? 'Review saved.' : result === 'invalid' ? 'Choose a valid status and nonnegative support minutes.' : 'Review could not be saved. Try again.'}</p>}
    {unavailable ? <p role="alert" className="my-8 p-5 border border-red-300">The pilot queue could not be loaded. Check the private pilot schema and server configuration; this does not mean there are no requests.</p> : <>
      <div className="my-8 flex flex-wrap gap-8">
        <p><strong className="text-3xl block text-navy">{rows.filter(r => r.status === 'new').length}</strong>new in this view</p>
        <p><strong className="text-3xl block text-navy">{rows.filter(r => r.qualification === 'standard').length}</strong>fit proposed scope</p>
        <p><strong className="text-3xl block text-navy">{rows.filter(r => r.support_minutes === null).length}</strong>with time unrecorded</p>
      </div>
      {!rows.length && <p className="py-8">No pilot requests yet. This queue records opt-ins; it does not count discovered prospects or demonstrate paid demand.</p>}
      {rows.map(row => <article key={row.id} className="border-t border-slate-200 py-8">
        <div className="flex flex-wrap justify-between gap-3"><h2 className="font-display text-2xl text-navy">{field(row, 'organization')}</h2><p>{row.qualification === 'standard' ? 'Fits proposed scope · review required' : 'Needs scoping'}</p></div>
        <p className="mt-2 break-words">{field(row, 'name')} · {row.email}</p>
        <p className="text-sm text-charcoal/70 mt-1">{row.created_at} · Reference {row.id}</p>
        <dl className="grid sm:grid-cols-2 gap-5 my-6">
          {['workflow', 'endpoint', 'access', 'readOnly', 'sampleInput', 'expectedResult', 'failureExample', 'pricingInterest', 'source'].map(key => <div key={key}><dt className="font-semibold">{{ workflow: 'Workflow', endpoint: 'Endpoint (not contacted)', access: 'Access', readOnly: 'Read-only', sampleInput: 'Fictional input', expectedResult: 'Expected result', failureExample: 'Expected failure', pricingInterest: 'Pricing interest', source: 'Source' }[key]}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{field(row, key) || 'Not provided'}</dd></div>)}
        </dl>
        <form action={updatePilot} className="flex flex-wrap items-end gap-4">
          <input type="hidden" name="id" value={row.id}/>
          <label className="block text-sm">Review status<select name="status" defaultValue={row.status} className="block mt-1 p-2 border rounded">{PILOT_STATUSES.map(s => <option key={s}>{s}</option>)}</select></label>
          <label className="block text-sm">Total support minutes (blank = unknown)<input name="supportMinutes" type="number" min="0" max="100000" defaultValue={row.support_minutes ?? ''} className="block mt-1 p-2 border rounded"/></label>
          <button className="btn-primary" type="submit">Save review</button>
        </form>
      </article>)}
    </>}
  </main>
}
