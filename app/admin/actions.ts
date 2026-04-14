'use server'

import { revalidatePath } from 'next/cache'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { supabase } from '@/lib/supabase'

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    throw new Error('Unauthorized')
  }
  if (!supabase) {
    throw new Error('Database not configured')
  }
  return supabase
}

export async function updateListingStatus(id: string, status: 'published' | 'pending_review' | 'rejected') {
  const db = await requireAdmin()
  const { error } = await db.from('listings').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/servers')
  revalidatePath('/')
}

export async function toggleListingFeatured(id: string, featured: boolean) {
  const db = await requireAdmin()
  const { error } = await db.from('listings').update({ featured }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/')
}

export async function toggleListingVerified(id: string, verified: boolean) {
  const db = await requireAdmin()
  const { error } = await db.from('listings').update({ verified }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/servers')
}

export async function deleteListing(id: string) {
  const db = await requireAdmin()
  const { error } = await db.from('listings').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/servers')
  revalidatePath('/')
}

export async function approveSubmission(submissionId: string) {
  const db = await requireAdmin()

  // Get the submission
  const { data: sub, error: fetchErr } = await db
    .from('submissions')
    .select('*')
    .eq('id', submissionId)
    .single()
  if (fetchErr || !sub) throw new Error('Submission not found')

  const data = sub.listing_data as Record<string, string>

  // Create a listing from the submission data
  const slug = data.name
    ?.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

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
    tags: data.tags ? (data.tags as unknown as string).split(',').map((t: string) => t.trim()) : [],
    source: 'submitted' as const,
    status: 'published' as const,
    creator_name: sub.submitter_name,
    creator_url: null,
  })
  if (insertErr) throw new Error(insertErr.message)

  // Mark submission as approved
  await db.from('submissions').update({ status: 'approved' }).eq('id', submissionId)

  revalidatePath('/admin')
  revalidatePath('/servers')
  revalidatePath('/')
}

export async function rejectSubmission(submissionId: string, notes?: string) {
  const db = await requireAdmin()
  const { error } = await db
    .from('submissions')
    .update({ status: 'rejected', notes: notes || 'Rejected by admin' })
    .eq('id', submissionId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}
