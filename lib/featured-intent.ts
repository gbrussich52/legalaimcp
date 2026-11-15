// Claude Fable 5.2 (executor), 2026-11-15: shared, client-safe enums and validation for the pre-Stripe step (intent form, cancel reasons, funnel steps).
import { z } from 'zod'

export const FEATURED_ROLES = ['works_here', 'agency', 'just_looking'] as const
export type FeaturedRole = (typeof FEATURED_ROLES)[number]
export const ROLE_LABELS: Record<FeaturedRole, string> = {
  works_here: 'I work at this company',
  agency: 'Agency or consultant for it',
  just_looking: 'Just looking',
}

export const CANCEL_REASONS = ['price', 'approval', 'detail', 'just_looking'] as const
export type CancelReason = (typeof CANCEL_REASONS)[number]
export const CANCEL_REASON_LABELS: Record<CancelReason, string> = {
  price: 'Price',
  approval: 'I need someone else to approve or pay',
  detail: 'I wanted more detail first',
  just_looking: 'Just looking',
}

export const FUNNEL_STEPS = [
  'featured_click', 'featured_intent_submitted', 'featured_stripe_redirect',
  'featured_cancel_reason', 'featured_paid', 'featured_expired',
] as const
export type FunnelStep = (typeof FUNNEL_STEPS)[number]

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,199}$/

// Format-only screen (no third-party lookups): a short list of throwaway domains.
const DISPOSABLE = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', '10minutemail.com', 'tempmail.com', 'temp-mail.org',
  'yopmail.com', 'trashmail.com', 'sharklasers.com', 'getnada.com', 'dispostable.com', 'throwawaymail.com',
  'maildrop.cc', 'fakeinbox.com', 'mailnesia.com', 'mintemail.com',
])

const EMAIL_RE = /^[^\s@]+@([a-z0-9-]+\.)+[a-z]{2,}$/i

export function isAcceptableWorkEmail(email: string): boolean {
  const e = email.trim().toLowerCase()
  if (e.length > 254 || !EMAIL_RE.test(e)) return false
  return !DISPOSABLE.has(e.split('@')[1])
}

export const intentFormSchema = z.object({
  listing_id: z.string().uuid().optional(),
  slug: z.string().min(1).max(200).optional(),
  email: z.string().trim().toLowerCase().refine(isAcceptableWorkEmail, 'Enter a valid work email'),
  role: z.enum(FEATURED_ROLES),
}).refine((b) => Boolean(b.listing_id || b.slug), { message: 'listing_id or slug is required' })
