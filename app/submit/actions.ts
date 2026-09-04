'use server'

import { supabase } from '@/lib/supabase'
import { z } from 'zod'

/**
 * z.string().url() accepts ANY parseable URL — including javascript: and
 * data: schemes. external_url / creator_url / mcp_repo_url end up in <a href>
 * on public pages, so restrict to http(s) at the validation boundary.
 */
const httpUrl = z
  .string()
  .url()
  // Zod v4 still runs refinements when .url() failed — guard the parse.
  .refine(
    (u) => {
      try {
        return /^https?:$/.test(new URL(u).protocol)
      } catch {
        return false
      }
    },
    { message: 'URL must use http or https' },
  )

/** Short display fields that end up in titles, JSON-LD and metadata: no markup. */
const noAngleBrackets = (max: number, min: number) =>
  z
    .string()
    .min(min)
    .max(max)
    .refine((s) => !/[<>]/.test(s), { message: 'Angle brackets are not allowed' })

const submissionSchema = z.object({
  name: noAngleBrackets(100, 2),
  tagline: noAngleBrackets(120, 10),
  category: z.enum([
    'document_processing',
    'case_management',
    'client_communication',
    'legal_research',
    'billing_time',
    'compliance',
    'general',
  ]),
  external_url: httpUrl,
  mcp_repo_url: httpUrl.optional().or(z.literal('')),
  mcp_install_command: z.string().optional(),
  pricing_model: z.enum(['free', 'freemium', 'paid', 'contact']),
  pricing_details: z.string().optional(),
  description: z.string().min(50).max(2000),
  creator_name: noAngleBrackets(100, 2),
  submitter_email: z.string().email(),
  creator_url: httpUrl.optional().or(z.literal('')),
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
