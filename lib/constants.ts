export const SITE_NAME = 'LegalAIMCP'
export const SITE_URL = 'https://legalaimcp.com'
// Latest meaningful content change site-wide; feeds WebSite JSON-LD dateModified.
// Bump with the dates in app/sitemap.ts.
export const SITE_LAST_MODIFIED = '2026-10-19'
export const SITE_DESCRIPTION = 'The curated directory of AI-powered integrations for law firms.'

export const NYCLAW_URL = 'https://nyclaw.io'
export const NYCLAW_CONTACT = 'https://nyclaw.io/#contact'
export const NYCLAW_CALENDLY = 'https://calendly.com/nyclaw-io-proton/30min'

export const CATEGORY_LABELS: Record<string, string> = {
  document_processing: 'Document Processing',
  case_management: 'Case Management',
  client_communication: 'Client Communication',
  legal_research: 'Legal Research',
  billing_time: 'Billing & Time',
  compliance: 'Compliance',
  general: 'General',
}

export const PRICING_LABELS: Record<string, string> = {
  free: 'Free',
  freemium: 'Freemium',
  paid: 'Paid',
  contact: 'Contact',
}

// Claude Sonnet 5.5, 2026-11-19: dates for the /best roundup Article JSON-LD. Published = the commit that added the roundup pages
// (724595e, 2026-08-07, also the audit date named in app/sitemap.ts). Modified = the sitemap date for those pages; bump both together.
export const BEST_ROUNDUP_PUBLISHED = '2026-08-07'
export const BEST_ROUNDUP_MODIFIED = '2026-11-12'
