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
  verified: boolean
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
  'id' | 'slug' | 'name' | 'tagline' | 'category' | 'pricing_model' | 'verified' | 'logo_url'
>

export const LISTING_CARD_COLUMNS =
  'id, slug, name, tagline, category, pricing_model, verified, logo_url'

export interface Category {
  slug: string
  name: string
  description: string
  icon: string
  display_order: number
}

export interface Submission {
  id: string
  listing_data: Record<string, unknown>
  submitter_email: string
  submitter_name: string
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
  created_at: string
}
