'use server'

import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const submissionSchema = z.object({
  name: z.string().min(2).max(100),
  tagline: z.string().min(10).max(120),
  category: z.enum([
    'document_processing',
    'case_management',
    'client_communication',
    'legal_research',
    'billing_time',
    'compliance',
    'general',
  ]),
  external_url: z.string().url(),
  mcp_repo_url: z.string().url().optional().or(z.literal('')),
  mcp_install_command: z.string().optional(),
  pricing_model: z.enum(['free', 'freemium', 'paid', 'contact']),
  pricing_details: z.string().optional(),
  description: z.string().min(50).max(2000),
  creator_name: z.string().min(2).max(100),
  submitter_email: z.string().email(),
  creator_url: z.string().url().optional().or(z.literal('')),
})

export type SubmissionState = {
  success: boolean
  error: string | null
}

export async function submitListing(
  _prevState: SubmissionState,
  formData: FormData
): Promise<SubmissionState> {
  const raw = Object.fromEntries(formData.entries())
  const parsed = submissionSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { submitter_email, creator_name, ...listingData } = parsed.data

  if (!supabase) {
    return { success: false, error: 'Service unavailable. Please try again later.' }
  }

  const { error } = await supabase.from('submissions').insert({
    listing_data: listingData,
    submitter_email,
    submitter_name: creator_name,
  })

  if (error) {
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true, error: null }
}
