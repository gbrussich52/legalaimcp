'use server'

import { revalidatePath } from 'next/cache'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getAdminClient } from '@/lib/supabase-admin'

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

  const data = sub.listing_data as Record<string, string>
  if (!data.name) throw new Error('Submission has no tool name')

  // Generate slug with uniqueness check
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
