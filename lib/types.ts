export type ListingCategory =
  | 'document_processing'
  | 'case_management'
  | 'client_communication'
  | 'legal_research'
  | 'billing_time'
  | 'compliance'
  | 'general'

export type PricingModel = 'free' | 'freemium' | 'paid' | 'contact'
export type ListingSource = 'curated' | 'submitted' | 'partner'
export type ListingStatus = 'published' | 'pending_review' | 'rejected'

export interface Listing {
  id: string
  name: string
  slug: string
  tagline: string
  description: string
  category: ListingCategory
  mcp_repo_url: string | null
  mcp_install_command: string | null
  external_url: string | null
  pricing_model: PricingModel
  pricing_details: string | null
  tags: string[]
  logo_url: string | null
  featured: boolean
  /**
   * When a paid Featured bump expires. Null + featured=true means editorial
   * indefinite (admin toggle). Null + featured=false means not featured.
   */
  featured_until: string | null
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  featured_purchased_at: string | null
  /**
   * Automated link-resolution check passed as of `verified_at`. Set only by
   * scripts/curate.mjs — never by hand, and never by the admin UI. Reading it
   * without `verified_at` is meaningless: the pair is the claim.
   */
  verified: boolean
  /** When the check that set `verified` actually ran. Null = never checked. */
  verified_at: string | null
  source: ListingSource
  status: ListingStatus
  creator_name: string | null
  creator_url: string | null
  created_at: string
  updated_at: string
}

/**
 * Subset of Listing needed to render a ListingCard / browse grid (audit Q3).
 * Browse, homepage, and category pages previously selected '*', over-fetching
 * `description` (up to 2000 chars per row) that the card never renders.
 * Keep LISTING_CARD_COLUMNS in sync with this type.
 */
export type ListingCardData = Pick<
  Listing,
  | 'id' | 'slug' | 'name' | 'tagline' | 'category' | 'pricing_model'
  | 'verified' | 'verified_at' | 'logo_url' | 'featured' | 'featured_until'
>

export const LISTING_CARD_COLUMNS =
  'id, slug, name, tagline, category, pricing_model, verified, verified_at, logo_url, featured, featured_until'

/**
 * Subset of Listing needed to render the public /servers/[slug] detail page.
 * Excludes internal-only columns (stripe_checkout_session_id,
 * stripe_payment_intent_id, featured_purchased_at, source, status,
 * created_at, updated_at, creator_name, creator_url) that the page never
 * reads — those have no reason to leave the database for a public request.
 * Keep LISTING_DETAIL_COLUMNS in sync with this type.
 */
export type ListingDetailData = Pick<
  Listing,
  | 'id' | 'slug' | 'name' | 'tagline' | 'description' | 'category'
  | 'mcp_repo_url' | 'mcp_install_command' | 'external_url'
  | 'pricing_model' | 'pricing_details' | 'tags' | 'logo_url'
  | 'featured' | 'featured_until' | 'verified' | 'verified_at'
>

export const LISTING_DETAIL_COLUMNS =
  'id, slug, name, tagline, description, category, mcp_repo_url, mcp_install_command, external_url, pricing_model, pricing_details, tags, logo_url, featured, featured_until, verified, verified_at'

export interface Category {
  slug: string
  name: string
  description: string
  icon: string
  display_order: number
}

export const CATEGORY_COLUMNS = 'slug, name, description, icon, display_order'

/** Every column of Listing — the admin dashboard genuinely needs the full row. */
export const LISTING_ADMIN_COLUMNS =
  'id, name, slug, tagline, description, category, mcp_repo_url, mcp_install_command, external_url, pricing_model, pricing_details, tags, logo_url, featured, featured_until, stripe_checkout_session_id, stripe_payment_intent_id, featured_purchased_at, verified, verified_at, source, status, creator_name, creator_url, created_at, updated_at'

export interface Submission {
  id: string
  listing_data: Record<string, unknown>
  submitter_email: string
  submitter_name: string
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
  created_at: string
}

/** Every column of Submission — the admin dashboard genuinely needs the full row. */
export const SUBMISSION_COLUMNS =
  'id, listing_data, submitter_email, submitter_name, status, notes, created_at'

export interface ListingPayment {
  id: string
  listing_id: string
  stripe_session_id: string
  amount_cents: number
  currency: string
  status: string
  created_at: string
}
