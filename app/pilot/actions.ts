// classification: PUBLIC
'use server'

import { headers } from 'next/headers'
import { isSameOriginRequest } from '@/lib/origin'
import { pilotSchema, qualifyPilot, type PilotState } from '@/lib/pilot-intake'
import { pilotSourceKey, submitPilotRequest } from '@/lib/pilot-store'

export async function submitPilot(_previous: PilotState, form: FormData): Promise<PilotState> {
  try {
    const requestHeaders = await headers()
    if (!isSameOriginRequest(requestHeaders) || form.get('website')) {
      return { success: false, error: 'Unable to accept this submission. Please reload and try again.' }
    }
    const values: Record<string, unknown> = {}
    for (const field of ['requestId','name','email','organization','workflow','endpoint','access','readOnly','sampleInput','expectedResult','failureExample','pricingInterest','source']) {
      values[field] = form.get(field) ?? ''
    }
    for (const field of ['consent','synthetic']) values[field] = ['on','true'].includes(String(form.get(field)))
    const parsed = pilotSchema.safeParse(values)
    if (!parsed.success) return { success: false, error: 'Please complete the required fields and both consent checkboxes using synthetic examples only.' }
    const sourceHash = pilotSourceKey(requestHeaders)
    if (!sourceHash) return { success: false, error: 'We could not save your request. Please try again later.' }
    const qualification = qualifyPilot(parsed.data).fit
    const result = await submitPilotRequest(parsed.data, qualification, sourceHash)
    if (result.status === 'saved') return { success: true, error: null, receipt: result.id, qualification }
    if (result.status === 'rate_limited') return { success: false, error: 'The submission limit has been reached. Please try again tomorrow.' }
    if (result.status === 'conflict') return { success: false, error: 'This submission reference was already used. Reload the form before trying again.' }
    return { success: false, error: 'We could not save your request. Please try again later.' }
  } catch { return { success: false, error: 'We could not save your request. Please try again later.' } }
}
