'use server'
// classification: PUBLIC
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { isSameOriginRequest } from '@/lib/origin'
import { getAdminClient } from '@/lib/supabase-admin'
import { pilotReviewSchema } from '@/lib/pilot-intake'

export async function updatePilot(formData: FormData): Promise<void> {
  if (!isSameOriginRequest(await headers()) || !(await isAdminAuthenticated())) throw new Error('Unauthorized')
  const parsed = pilotReviewSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) redirect('/admin/pilots?result=invalid')
  const { id, status, supportMinutes } = parsed.data
  let saved = false
  try {
    const { data, error } = await getAdminClient().from('pilot_requests')
      .update({ status, support_minutes: supportMinutes, updated_at: new Date().toISOString() })
      .eq('id', id).select('id').maybeSingle()
    saved = !error && Boolean(data)
  } catch { /* Do not expose database errors or request content. */ }
  revalidatePath('/admin/pilots')
  redirect(`/admin/pilots?result=${saved ? 'saved' : 'unavailable'}`)
}
