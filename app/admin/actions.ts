'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getAdminClient } from '@/lib/supabase-admin'
import { isSameOriginRequest } from '@/lib/origin'
import { CATEGORY_LABELS, PRICING_LABELS } from '@/lib/constants'
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
 * once all 54 live submissions have been audited against this schema (Wave 3).
 */

/** http(s)-only URL — z.string().url() alone accepts javascript:/data: schemes. */
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
  external_url: httpUrl,
  mcp_repo_url: httpUrl.optional().or(z.literal('')),
  mcp_install_command: z.string().optional(),
  pricing_model: z.enum(['free', 'freemium', 'paid', 'contact']),
  pricing_details: z.string().optional(),
  description: z.string().min(50).max(2000),
  creator_url: httpUrl.optional().or(z.literal('')),
})

async function requireAdmin() {
  // CSRF defense: server actions are POST endpoints reachable with ambient
  // cookies — reject cross-origin invocations before checking auth.
  // (Next 15 has its own Origin/Host check; this makes it explicit + testable.)
  if (!isSameOriginRequest(await headers())) {
    throw new Error('Unauthorized')
  }
  if (!(await isAdminAuthenticated())) {
    throw new Error('Unauthorized')
  }
  return getAdminClient()
}

/**
 * Revalidate every route that renders listing data (audit Q6).
 * Prior version missed /categories/[slug] (stale category grids/counts) and
 * /servers/[slug] (stale detail pages after edit/delete). The 'page' variants
 * invalidate all instances of the dynamic route in one call — no extra DB
 * lookup needed to resolve the affected slug.
 */
function revalidateAll() {
  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/servers')
  revalidatePath('/servers/[slug]', 'page')
  revalidatePath('/categories/[slug]', 'page')
}

// Runtime status allowlist — the TS signature does not protect against a
// bypassed/hand-crafted server-action call sending an arbitrary string.
const VALID_LISTING_STATUSES = new Set(['published', 'pending_review', 'rejected'])

export async function updateListingStatus(id: string, status: 'published' | 'pending_review' | 'rejected') {
  const db = await requireAdmin()
  if (!VALID_LISTING_STATUSES.has(status)) throw new Error('Invalid status')
  const { error } = await db.from('listings').update({ status }).eq('id', id)
  if (error) throw new Error(`Failed to update status: ${error.message}`)
  revalidateAll()
}

/**
 * Manual / editorial Featured toggle.
 * Enabling with featured_until = null means indefinite editorial placement.
 * Paid bumps set a concrete featured_until via the Stripe webhook.
 */
export async function toggleListingFeatured(id: string, featured: boolean) {
  const db = await requireAdmin()
  const { error } = await db
    .from('listings')
    .update({ featured, featured_until: null })
    .eq('id', id)
  if (error) throw new Error(`Failed to update featured: ${error.message}`)
  revalidateAll()
}

// NOTE: there is deliberately no toggleListingVerified action.
//
// `verified` is a claim about a check that ran, so the only thing entitled to
// set it is the check — scripts/curate.mjs verify, which writes it together
// with `verified_at`. When this was a hand-toggled checkbox it drifted into
// meaning "brand I recognize": 12 listings carried the badge, none from a
// check, and the badge sat next to homepage copy promising manual review while
// nine listings pointed at domains that had never resolved.
//
// Removing the affordance is the fix. Leaving the action here with a comment
// saying "don't use this" would have left the same drift one click away, and
// the failure is silent — nobody notices a badge that was never earned.

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

  // Q3: explicit columns — only what the approval flow actually needs.
  const { data: sub, error: fetchErr } = await db
    .from('submissions')
    .select('id, listing_data, submitter_name, status')
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

  // Q2: re-validate listing_data against schema before publishing.
  // Warn-on-failure (see listingDataSchema comment above) — log the issue but
  // do not block the approve action, since all stored submissions should have
  // passed this on entry. When validation SUCCEEDS we insert the parsed
  // (schema-clean) values; when it fails we fall back to the raw values but
  // coerce the enum fields below so an invalid category/pricing_model can
  // never reach the published listings table.
  const validation = listingDataSchema.safeParse(rawData)
  if (!validation.success) {
    console.warn(
      `[approveSubmission] Submission ${submissionId} listing_data failed re-validation — proceeding with coerced fallback:`,
      validation.error.issues,
    )
  }

  // Enum coercion fallback — reuses the same runtime allowlists the public
  // browse page validates against (lib/constants).
  const category = validation.success
    ? validation.data.category
    : data.category && Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, data.category)
      ? data.category
      : 'general'
  const pricingModel = validation.success
    ? validation.data.pricing_model
    : data.pricing_model && Object.prototype.hasOwnProperty.call(PRICING_LABELS, data.pricing_model)
      ? data.pricing_model
      : 'free'

  // Generate slug with uniqueness check (re-assert name is present so TS narrows
  // data.name from string|undefined to string; rawData.name was guarded above).
  if (!data.name) throw new Error('Submission has no tool name')
  let slug = generateSlug(data.name)
  const { data: existing } = await db.from('listings').select('slug').eq('slug', slug).maybeSingle()
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`
  }

  // Prefer validated values; raw fallbacks only when re-validation failed
  // (enums are coerced above and URLs guarded below in that case).
  const v = validation.success ? validation.data : null

  /**
   * Fallback URL guard: when re-validation failed, raw URL fields must still
   * never publish a non-http(s) scheme (javascript:/data: would land in
   * <a href> on the public detail page). Returns null for anything unsafe.
   */
  const safeHttpUrl = (value: string | undefined): string | null => {
    if (!value) return null
    try {
      return /^https?:$/.test(new URL(value).protocol) ? value : null
    } catch {
      return null
    }
  }

  const { error: insertErr } = await db.from('listings').insert({
    name: v?.name ?? data.name,
    slug,
    tagline: v?.tagline ?? data.tagline ?? '',
    description: v?.description ?? data.description ?? '',
    category,
    mcp_repo_url: v ? v.mcp_repo_url || null : safeHttpUrl(data.mcp_repo_url),
    mcp_install_command: (v ? v.mcp_install_command : data.mcp_install_command) || null,
    external_url: v ? v.external_url : safeHttpUrl(data.external_url),
    pricing_model: pricingModel,
    pricing_details: (v ? v.pricing_details : data.pricing_details) || null,
    tags: data.tags ? String(data.tags).split(',').map((t: string) => t.trim()) : [],
    source: 'submitted' as const,
    status: 'published' as const,
    creator_name: sub.submitter_name || null,
    creator_url: v ? v.creator_url || null : safeHttpUrl(data.creator_url),
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
