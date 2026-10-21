import { z } from 'zod'
import { supabase } from './supabase'
import { toStructured, type ToolRow } from './mcp-results'
import { FIRM_SIZES } from './recommend'

/** Fixed choices intentionally exclude client matter details, files and arbitrary URLs. */
export const SHORTLIST_WORKFLOWS = {
  contracts: { label: 'Contract review tools', category: 'document_processing', terms: ['contract', 'agreement', 'redlin'], steps: ['Define the review checklist and approved storage.', 'Try the shortlist on a fictional agreement.', 'A lawyer reviews every proposed change before use.'], boundary: 'This compares software; it does not review contracts or provide legal advice.' },
  documents: { label: 'Document collection', category: 'document_processing', terms: [], steps: ['Use your firm-approved document checklist.', 'Trial missing-document flags on fictional files.', 'Staff confirm completeness and recipients before any follow-up.'], boundary: 'No client documents are accepted or processed here.' },
  intake: { label: 'Intake follow-up', category: 'client_communication', terms: [], steps: ['Check the intake system’s built-in acknowledgment features.', 'Trial a draft-and-approve workflow with fictional inquiries.', 'A lawyer handles conflict clearance and client acceptance.'], boundary: 'No messages are sent and no conflict or acceptance decisions are automated.' },
  billing: { label: 'Billing preparation', category: 'billing_time', terms: [], steps: ['Start with approved time entries and rates.', 'Reconcile a fictional draft invoice against original entries.', 'A person approves every invoice before posting.'], boundary: 'No invented time, invoice posting, payments or trust-account changes.' },
  research: { label: 'Legal research tools', category: 'legal_research', terms: [], steps: ['Define jurisdiction, coverage and freshness needs.', 'Compare publisher coverage and citation verification features.', 'A qualified lawyer checks primary authorities and current validity.'], boundary: 'This is software discovery, not a case-law search engine or legal opinion.' },
  compliance: { label: 'Compliance tools', category: 'compliance', terms: [], steps: ['Define the jurisdiction and review owner.', 'Compare documented coverage against a fictional checklist.', 'A qualified reviewer validates every compliance conclusion.'], boundary: 'No compliance certification or jurisdiction-specific legal advice is provided.' },
} as const
export const ShortlistInput = z.strictObject({
  workflow: z.enum(['contracts', 'documents', 'intake', 'billing', 'research', 'compliance']).describe('Software workflow only; never include client or matter details.'),
  firm_size: z.enum(FIRM_SIZES).default('small'),
  free_only: z.boolean().default(false).describe('Only listings labeled free; freemium is excluded. Directory access itself is always free.'),
  limit: z.number().int().min(1).max(5).default(3),
})
export type ShortlistRequest = z.infer<typeof ShortlistInput>
const ResultItem = z.strictObject({
  slug: z.string().max(100), name: z.string().max(160), summary: z.string().max(400),
  pricing: z.enum(['free', 'freemium', 'paid', 'contact']), pricing_note: z.string().max(500),
  listing_url: z.string().url(), source_url: z.string().url().nullable(),
  source_reviewed_at: z.string().nullable(), links_checked_at: z.string().nullable(),
  compatibility: z.literal('Not tested with a customer account or ChatGPT'),
  connection_type: z.enum(['official', 'community']).nullable(),
  requirements: z.string().max(1500), permissions: z.string().max(1500),
  reasons: z.array(z.string()).max(3),
})
export const ShortlistOutput = z.strictObject({
  workflow: z.string(), firm_size: z.enum(FIRM_SIZES), free_only: z.boolean(), retrieved_at: z.string(),
  catalog_count: z.number().int(), count: z.number().int(), tools: z.array(ResultItem).max(5),
  steps: z.array(z.string()).length(3), boundary: z.string(), methodology: z.string(), freshness_note: z.string(),
})
export type ShortlistResult = z.infer<typeof ShortlistOutput>
const COLUMNS = 'slug,name,tagline,description,category,pricing_model,pricing_details,verified,verified_at,external_url,mcp_repo_url,mcp_install_command,creator_name,firm_size_fit'
const text = (value: unknown, cap: number) => typeof value === 'string' ? value.slice(0, cap) : ''
/** Display-only links. Nothing in this module fetches a row's URL. */
export function publicHttps(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2000) return null
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !host.includes('.') || host.endsWith('.local') || host.endsWith('.internal') || host === 'localhost' || host.endsWith('.localhost') || /^[\d.]+$/.test(host) || host.includes(':')) return null
    return url.href
  } catch { return null }
}

export function buildShortlist(rows: ToolRow[], input: ShortlistRequest, now = new Date()): ShortlistResult {
  const workflow = SHORTLIST_WORKFLOWS[input.workflow]
  const pricingOrder: Record<string, number> = { free: 0, freemium: 1, paid: 2, contact: 3 }
  const ranked = rows.filter(row => {
    if (row.category !== workflow.category || !/^[a-z0-9-]{1,100}$/.test(String(row.slug))) return false
    if (!(String(row.pricing_model) in pricingOrder) || input.free_only && row.pricing_model !== 'free') return false
    const prose = `${text(row.name, 160)} ${text(row.tagline, 400)} ${text(row.description, 5000)}`.toLowerCase()
    return workflow.terms.length === 0 || workflow.terms.some(term => prose.includes(term))
  }).map(row => ({row, sizeMatch: Array.isArray(row.firm_size_fit) && row.firm_size_fit.includes(input.firm_size), specificity: workflow.terms.some(term => `${text(row.name,160)} ${text(row.tagline,400)}`.toLowerCase().includes(term)) ? 2 : 1}))
    .sort((a,b) => b.specificity-a.specificity || Number(b.sizeMatch)-Number(a.sizeMatch) || pricingOrder[String(a.row.pricing_model)]-pricingOrder[String(b.row.pricing_model)] || String(a.row.slug).localeCompare(String(b.row.slug)))
  const tools = ranked.slice(0,input.limit).map(({row,sizeMatch,specificity}) => {
    const item = toStructured(row)
    return {
      slug: item.slug, name: text(item.name,160), summary: text(item.tagline,400),
      pricing: item.pricing_model as 'free'|'freemium'|'paid'|'contact',
      pricing_note: text(item.pricing_details,500) || 'Confirm current vendor pricing and plan requirements at the source.',
      listing_url: item.listing_url,
      source_url: publicHttps(item.connection?.source_url) ?? publicHttps(item.website) ?? publicHttps(item.repo),
      source_reviewed_at: item.connection?.documentation_reviewed_at ?? null,
      links_checked_at: item.links_verified_at,
      compatibility: 'Not tested with a customer account or ChatGPT' as const,
      connection_type: item.connection?.type ?? null,
      requirements: text(item.connection?.requirements,1500) || 'No reviewed setup guide attached. Confirm requirements with the publisher.',
      permissions: text(item.connection?.permissions,1500) || 'Permissions have not been reviewed. Check scopes and data handling before connecting.',
      reasons: [`Listed under ${item.category_label}`, ...(sizeMatch ? [`Catalog tags include ${input.firm_size}-size firms`] : []), ...(input.workflow === 'contracts' ? [specificity===2 ? 'Name or tagline mentions contracts or agreements' : 'Description mentions contracts or agreements'] : [])],
    }
  })
  return ShortlistOutput.parse({
    workflow: workflow.label, firm_size: input.firm_size, free_only: input.free_only,
    retrieved_at: now.toISOString(), catalog_count: rows.length, count: tools.length, tools,
    steps: [...workflow.steps], boundary: workflow.boundary,
    methodology: 'Category match first. Contract picks require contract-related text and prioritize name/tagline evidence over description-only mentions; then catalog firm-size tags, pricing tier and stable slug order. Paid placements and link-check badges do not affect this shortlist. Directory labels are broad signals, not a product evaluation.',
    freshness_note: 'Catalog reads may be cached for up to five minutes. Retrieved at is not a source review or live compatibility test. Link dates describe automated URL checks only. Documentation review dates may be stale; recheck publisher requirements, permissions and pricing.',
  })
}
export class CatalogUnavailable extends Error {}
export async function getShortlist(input: ShortlistRequest): Promise<ShortlistResult> {
  if (!supabase) throw new CatalogUnavailable('Catalog is not configured.')
  try {
    const {data,error} = await supabase.from('listings').select(COLUMNS).eq('status','published').order('slug').limit(201).abortSignal(AbortSignal.timeout(8000))
    if (error || !data || data.length > 200) throw new CatalogUnavailable('Catalog retrieval failed or exceeded the safety cap.')
    return buildShortlist(data as ToolRow[],input)
  } catch { throw new CatalogUnavailable('Catalog is temporarily unavailable. Try again later; no sample catalog was substituted.') }
}
