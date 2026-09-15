// classification: PUBLIC
import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'
import { createSchemaClient } from '@/lib/supabase'
import { PILOT_CONSENT_VERSION, type PilotInput } from '@/lib/pilot-intake'

export type PilotSaveResult = { status: 'saved'; id: string } | { status: 'rate_limited' | 'conflict' | 'unavailable' }

/** A rotating keyed identifier; raw addresses never enter persistence or logs. */
export function pilotSourceKey(headers: Pick<Headers, 'get'>): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key || key === 'undefined') return null
  let source = 'local-development'
  if (process.env.NODE_ENV === 'production') {
    if (process.env.VERCEL !== '1') return null
    const address = headers.get('x-vercel-forwarded-for')?.split(',')[0].trim()
    if (!address || !isIP(address)) return null
    source = address
  }
  return createHmac('sha256', key).update(`pilot-source:v1:${new Date().toISOString().slice(0,10)}:${source}`).digest('hex')
}

/** Private service-role persistence. Never invokes submitted endpoints or sends messages. */
export async function submitPilotRequest(data: PilotInput, qualification: 'standard' | 'needs_scope', sourceHash: string): Promise<PilotSaveResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || url === 'undefined' || key === 'undefined' || !/^[a-f0-9]{64}$/.test(sourceHash)) return { status: 'unavailable' }
  const payload = {
    name: data.name.trim(), email: data.email.trim().toLowerCase(), organization: data.organization.trim(),
    workflow: data.workflow.trim(), endpoint: data.endpoint?.trim() || '', access: data.access, readOnly: data.readOnly,
    sampleInput: data.sampleInput.trim(), expectedResult: data.expectedResult.trim(), failureExample: data.failureExample.trim(),
    pricingInterest: data.pricingInterest, source: data.source,
    consent: { contact: true, synthetic: true, version: PILOT_CONSENT_VERSION },
  }
  try {
    const client = createSchemaClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: result, error } = await client.rpc('submit_pilot_request', {
      p_request_id: data.requestId, p_payload: payload, p_qualification: qualification, p_source_hash: sourceHash,
    }).abortSignal(AbortSignal.timeout(10000))
    if (error || !result || typeof result !== 'object') return { status: 'unavailable' }
    if (result.status === 'saved' && result.id === data.requestId) return { status: 'saved', id: result.id }
    if (result.status === 'rate_limited' || result.status === 'conflict') return { status: result.status }
    return { status: 'unavailable' }
  } catch { return { status: 'unavailable' } }
}
