'use server'

import { revalidatePath } from 'next/cache'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getAdminClient } from '@/lib/supabase-admin'
import { z } from 'zod'

/**
 * Schema matching the shape of listing_data stored in the submissions table.
 *
 * This mirrors the submissionSchema in app/submit/actions.ts, minus the fields
 * that are extracted before storage (submitter_email, creator_name). Min-length
 * constraints from the original schema are preserved — all stored submissions
 * passed these rules on entry so they should pass here too.
 *
 * Validation is intentionally warn-on-failure rather than hard-throw.
 * Rationale: if a future schema change tightens constraints, or if any
 * submission was stored via a migration / admin backdoor that bypassed
 * the public form, a hard-throw would silently block the approve action
 * on production data. Instead we log the issue and continue — this surfaces
 * problems in logs without taking down the admin panel. Switch to hard-throw
 * once all 54 live submissions have been audited against this schema (Wave 2).
 */
const listingDataSchema = z.object({
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
  creator_url: z.string().url().optional().or(z.literal('')),
})

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    throw new Error('Unauthorized')
  }
  return getAdminClient()
}

function revalidateAll() {
  revalidatePath('/admin')
  revalidatePath('/servers')
  revalidatePath('/')
}

export async function updateListingStatus(id: string, status: 'published' | 'pending_review' | 'rejected') {
  const db = await requireAdmin()
  const { error } = await db.from('listings').update({ status }).eq('id', id)
  if (error) throw new Error(`Failed to update status: ${error.message}`)
  revalidateAll()
}

export async function toggleListingFeatured(id: string, featured: boolean) {
  const db = await requireAdmin()
  const { error } = await db.from('listings').update({ featured }).eq('id', id)
  if (error) throw new Error(`Failed to update featured: ${error.message}`)
  revalidateAll()
}

export async function toggleListingVerified(id: string, verified: boolean) {
  const db = await requireAdmin()
  const { error } = await db.from('listings').update({ verified }).eq('id', id)
  if (error) throw new Error(`Failed to update verified: ${error.message}`)
  revalidateAll()
}

export async function deleteListing(id: string) {
  const db = await requireAdmin()
  const { error } = await db.from('listings').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete listing: ${error.message}`)
  revalidateAll()
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function approveSubmission(submissionId: string) {
  const db = await requireAdmin()

  const { data: sub, error: fetchErr } = await db
    .from('submissions')
    .select('*')
    .eq('id', submissionId)
    .single()
  if (fetchErr || !sub) throw new Error('Submission not found')

  // Cast to Record<string, unknown> for safe property access; individual
  // string fields are cast to string at the insert site via String() or '|| ""'.
  const rawData = sub.listing_data as Record<string, unknown>
  if (!rawData.name) throw new Error('Submission has no tool name')
  // Narrow to string-keyed record for downstream usage in insert payload.
  const data: Record<string, string | undefined> = Object.fromEntries(
    Object.entries(rawData).map(([k, v]) => [k, v != null ? String(v) : undefined]),
  )

  // Re-validate listing_data against schema before publishing.
  // Warn-on-failure (see listingDataSchema comment above) — log the issue but
  // do not block the approve action, since all stored submissions should have
  // passed this on entry.
  const validation = listingDataSchema.safeParse(rawData)
  if (!validation.success) {
    console.warn(
      `[approveSubmission] Submission ${submissionId} listing_data failed re-validation — proceeding anyway:`,
      validation.error.issues,
    )
  }

  // Generate slug with uniqueness check (re-assert name is present so TS narrows
  // data.name from string|undefined to string; rawData.name was guarded above).
  if (!data.name) throw new Error('Submission has no tool name')
  let slug = generateSlug(data.name)
  const { data: existing } = await db.from('listings').select('slug').eq('slug', slug).maybeSingle()
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`
  }

  const { error: insertErr } = await db.from('listings').insert({
    name: data.name,
    slug,
    tagline: data.tagline || '',
    description: data.description || '',
    category: data.category || 'general',
    mcp_repo_url: data.mcp_repo_url || null,
    mcp_install_command: data.mcp_install_command || null,
    external_url: data.external_url || null,
    pricing_model: data.pricing_model || 'free',
    pricing_details: data.pricing_details || null,
    tags: data.tags ? String(data.tags).split(',').map((t: string) => t.trim()) : [],
    source: 'submitted' as const,
    status: 'published' as const,
    creator_name: sub.submitter_name || null,
    creator_url: data.creator_url || null,
  })
  if (insertErr) throw new Error(`Failed to create listing: ${insertErr.message}`)

  await db.from('submissions').update({ status: 'approved' }).eq('id', submissionId)
  revalidateAll()
}

export async function rejectSubmission(submissionId: string, notes?: string) {
  const db = await requireAdmin()
  const { error } = await db
    .from('submissions')
    .update({ status: 'rejected', notes: notes || 'Rejected by admin' })
    .eq('id', submissionId)
  if (error) throw new Error(`Failed to reject submission: ${error.message}`)
  revalidatePath('/admin')
}
