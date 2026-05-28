'use server'

import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// Single-field opt-in matches CRO rule #4 (≤5 fields) and #23 (micro-commitment
// ladder — the smallest possible yes). We could also capture firm-size or
// practice-area here, but every extra field bleeds conversion ~5-10%; collect
// those via the email sequence after the visitor has self-identified.
const subscribeSchema = z.object({
  email: z.string().email('Please enter a valid email.'),
  source: z.string().max(40).optional(),
})

export type SubscribeState = {
  success: boolean
  error: string | null
}

export async function subscribeToChecklist(
  _prevState: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  const raw = Object.fromEntries(formData.entries())
  const parsed = subscribeSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid email.' }
  }

  if (!supabase) {
    return { success: false, error: 'Service unavailable. Please try again later.' }
  }

  const { email, source } = parsed.data
  const { error } = await supabase.from('subscribers').insert({
    email: email.toLowerCase().trim(),
    source: source ?? 'homepage_checklist',
  })

  // Unique-violation (23505) = idempotent re-submit. Treat as success — the
  // subscriber already has the checklist; no value in surfacing "you already
  // signed up" anxiety to the visitor.
  if (error && error.code !== '23505') {
    console.error('[subscribe] insert failed:', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true, error: null }
}
