// classification: PUBLIC
// Claude Opus 5.5, 2026-11-27: the AI Disclosure standard. One short, fixed set of questions every legal AI vendor can
// answer in public, each mapped to the lawyer's duty it serves. Sources read on 2026-11-27: ABA Formal Opinion 512
// (July 29, 2024) as quoted by LawSites and The Bar Examiner, and the Illinois ARDC GAI Terms of Use Checklist.
// This file has no imports on purpose, so the schema can be checked without the rest of the app.
//
// Rule for this file: no real vendor is seeded here. A disclosure is added only when the vendor sends it, and a
// Reviewed one only after we read each answer in the vendor's own terms, privacy policy or trust page.

export type Answer = 'yes' | 'no' | 'not_disclosed'

export const ANSWER_LABELS: Record<Answer, string> = {
  yes: 'Yes',
  no: 'No',
  not_disclosed: 'Not disclosed',
}

export type DutyId = 'competence' | 'confidentiality' | 'informed_consent' | 'supervision'

export interface Duty {
  id: DutyId
  label: string
  /** What the duty asks, in plain words, from the sources listed on /ai-disclosure. */
  summary: string
}

export const DUTIES: Record<DutyId, Duty> = {
  competence: {
    id: 'competence',
    label: 'Competence (Rule 1.1)',
    summary: 'ABA Op. 512 says a lawyer must have a reasonable understanding of what a tool can and cannot do. You do not need to be an expert. You do need to know what happens to the data.',
  },
  confidentiality: {
    id: 'confidentiality',
    label: 'Confidentiality (Rule 1.6)',
    summary: 'ABA Op. 512 says to read and understand the tool\'s terms of use, privacy policy and related contract terms, or ask someone who has, so you know who can see what you put in.',
  },
  informed_consent: {
    id: 'informed_consent',
    label: 'Informed consent for self-learning tools',
    summary: 'ABA Op. 512 says a client\'s informed consent is required before information about the representation goes into a self-learning tool. Boilerplate in an engagement letter is not enough.',
  },
  supervision: {
    id: 'supervision',
    label: 'Supervision (Rules 5.1 and 5.3)',
    summary: 'ABA Op. 512 says managing lawyers must set clear policies for AI use, and that lawyers must make sure an outside provider will protect confidential information. It points to checks such as the vendor\'s security, its conflicts check system, and where you could seek relief if it breaks the agreement.',
  },
}

export type IllinoisItemId =
  | 'no_model_training'
  | 'purpose_limitation'
  | 'data_retention'
  | 'data_residency'
  | 'breach_notification'
  | 'risk_management'
  | 'third_party_access'

/** Item names as the Illinois ARDC GAI Terms of Use Checklist prints them. */
export const ILLINOIS_ITEMS: Record<IllinoisItemId, string> = {
  no_model_training: 'No Model Training',
  purpose_limitation: 'Purpose Limitation',
  data_retention: 'Data Retention',
  data_residency: 'Data Residency',
  breach_notification: 'Breach Notification',
  risk_management: 'Risk Management',
  third_party_access: 'Third-Party Access Controls',
}

export type FieldId =
  | 'trains_by_default'
  | 'training_opt_out'
  | 'third_party_models'
  | 'base_models_named'
  | 'retention_period'
  | 'deletion_on_request'
  | 'storage_location'
  | 'encryption'
  | 'security_certification'
  | 'human_review'
  | 'prompt_logging'
  | 'zero_data_retention'
  | 'breach_notice'
  | 'subprocessor_list'
  | 'law_firm_terms'

export interface DisclosureField {
  id: FieldId
  /** The statement a vendor answers yes or no to. */
  label: string
  /** What the detail line holds when the answer is yes, for example the names of the model providers. */
  detailLabel?: string
  duties: readonly DutyId[]
  illinois: readonly IllinoisItemId[]
  /** The question for the vendor when the answer is not disclosed. */
  ask: string
  /** The answer that needs a follow-up even though it was disclosed. */
  flagIf?: 'yes' | 'no'
  /** What to do about a flagged answer. */
  flagNote?: string
}

export const DISCLOSURE_FIELDS: readonly DisclosureField[] = [
  {
    id: 'trains_by_default',
    label: 'Trains its models on customer data by default',
    duties: ['informed_consent', 'confidentiality'],
    illinois: ['no_model_training'],
    ask: 'Do you use our inputs or outputs to train or improve any model, yours or a provider\'s? Where do your terms say so?',
    flagIf: 'yes',
    flagNote: 'This reads as a self-learning tool. Turn training off first, or get informed client consent before client information goes in.',
  },
  {
    id: 'training_opt_out',
    label: 'Customer can opt out of training',
    duties: ['informed_consent', 'confidentiality'],
    illinois: ['no_model_training'],
    ask: 'Can we turn off all training on our data, in writing, for every user at the firm?',
    flagIf: 'no',
    flagNote: 'With no opt out, ask for written terms that bar training on firm data before you use it with client matters.',
  },
  {
    id: 'third_party_models',
    label: 'Sends inputs to third-party model providers',
    detailLabel: 'Providers named',
    duties: ['confidentiality', 'supervision'],
    illinois: ['third_party_access'],
    ask: 'Which outside model providers receive our inputs, and do you bind each one to the same data terms you give us?',
    flagIf: 'yes',
    flagNote: 'Ask whether the vendor binds each provider to the same terms it gives you.',
  },
  {
    id: 'base_models_named',
    label: 'Names the base model or models it uses',
    detailLabel: 'Models named',
    duties: ['competence'],
    illinois: [],
    ask: 'Which base models does the product use today, and will you tell us when that changes?',
    flagIf: 'no',
    flagNote: 'Without the model name it is hard to judge what the tool can and cannot do.',
  },
  {
    id: 'retention_period',
    label: 'States how long it keeps customer data',
    detailLabel: 'Retention period',
    duties: ['confidentiality'],
    illinois: ['data_retention'],
    ask: 'How long do you keep our inputs, outputs and uploaded files, and where is that written?',
  },
  {
    id: 'deletion_on_request',
    label: 'Deletes customer data on request',
    detailLabel: 'Deleted within',
    duties: ['confidentiality'],
    illinois: ['data_retention'],
    ask: 'If we ask you to delete our data, or we leave, how fast is it gone from your systems and backups?',
    flagIf: 'no',
    flagNote: 'Ask what happens to firm data when you end the contract.',
  },
  {
    id: 'storage_location',
    label: 'Says where customer data is stored',
    detailLabel: 'Country',
    duties: ['confidentiality', 'competence'],
    illinois: ['data_residency'],
    ask: 'In which countries do you store and process our data?',
  },
  {
    id: 'encryption',
    label: 'Encrypts data in transit and at rest',
    duties: ['confidentiality'],
    illinois: ['risk_management'],
    ask: 'Do you encrypt our data both in transit and at rest?',
    flagIf: 'no',
    flagNote: 'Ask an IT or security adviser whether the controls are enough for client data.',
  },
  {
    id: 'security_certification',
    label: 'Holds a SOC 2 Type II report or ISO 27001 certificate',
    detailLabel: 'Report and date',
    duties: ['supervision', 'confidentiality'],
    illinois: ['risk_management'],
    ask: 'Do you have a current SOC 2 Type II report or ISO 27001 certificate, and what is its date?',
  },
  {
    id: 'human_review',
    label: 'Vendor staff can read customer inputs or outputs',
    duties: ['confidentiality', 'supervision'],
    illinois: ['purpose_limitation'],
    ask: 'Can your staff read our inputs or outputs? When, and who approves it?',
    flagIf: 'yes',
    flagNote: 'Ask when staff may look, who approves it, and whether they are bound to confidentiality.',
  },
  {
    id: 'prompt_logging',
    label: 'Logs prompts',
    detailLabel: 'Logs kept for',
    duties: ['confidentiality'],
    illinois: ['data_retention'],
    ask: 'Do you log our prompts? For how long, and who can see the logs?',
    flagIf: 'yes',
    flagNote: 'Ask how long logs are kept and who can see them.',
  },
  {
    id: 'zero_data_retention',
    label: 'Offers a zero data retention option',
    duties: ['confidentiality'],
    illinois: ['purpose_limitation'],
    ask: 'Do you offer a zero data retention setting, and does it cover every model provider you use?',
  },
  {
    id: 'breach_notice',
    label: 'Commits to notify customers of a breach',
    detailLabel: 'Notice within',
    duties: ['confidentiality', 'supervision'],
    illinois: ['breach_notification'],
    ask: 'If our data is exposed, how soon will you tell us, and where is that promise written?',
    flagIf: 'no',
    flagNote: 'Ask for a written breach notice promise with a time limit.',
  },
  {
    id: 'subprocessor_list',
    label: 'Publishes a list of subprocessors',
    detailLabel: 'List address',
    duties: ['supervision'],
    illinois: ['third_party_access'],
    ask: 'Where is your current subprocessor list, and how do you tell customers when it changes?',
    flagIf: 'no',
    flagNote: 'Ask for the list in writing.',
  },
  {
    id: 'law_firm_terms',
    label: 'Has confidentiality and conflicts terms for law firm data',
    duties: ['supervision', 'confidentiality'],
    illinois: ['purpose_limitation'],
    ask: 'Will you sign confidentiality terms for client data, and how do you handle adverse clients and conflicts?',
    flagIf: 'no',
    flagNote: 'ABA Op. 512 points to the vendor\'s conflicts check system and an enforceable promise to keep data confidential.',
  },
]

export interface Source {
  url: string
  /** Section, heading or clause number on that page. */
  section?: string
}

export interface FieldAnswer {
  answer: Answer
  detail?: string
  source?: Source
}

export type DisclosureStatus = 'self_reported' | 'reviewed'

export interface AiDisclosure {
  /** Listing slug on legalaimcp.com. */
  slug: string
  vendor: string
  product: string
  /** True only for the made-up example on /ai-disclosure. */
  fictional?: boolean
  status: DisclosureStatus
  /** ISO date the vendor's answers were published here. */
  publishedAt: string
  /** ISO date of our last check. Required when status is reviewed. */
  reviewedAt?: string
  answers: Record<FieldId, FieldAnswer>
}

export const REVIEWED_PRICE_USD = 1200
export const REVIEW_INTERVAL_DAYS = 90
export const DISCLOSURE_CONTACT = 'hello@legalaimcp.com'
export const PUBLISH_MAILTO = `mailto:${DISCLOSURE_CONTACT}?subject=${encodeURIComponent('Publish an AI Disclosure')}`
export const REVIEWED_MAILTO = `mailto:${DISCLOSURE_CONTACT}?subject=${encodeURIComponent('Reviewed AI Disclosure')}`
export const SOURCES_READ_ON = '2026-11-27'

/** A made-up vendor that shows how a label reads. Every answer and link is invented; example.com is a reserved domain. */
export const EXAMPLE_DISCLOSURE: AiDisclosure = {
  slug: 'example-vendor',
  vendor: 'Example Vendor, Inc.',
  product: 'Example Draft Assistant',
  fictional: true,
  status: 'self_reported',
  publishedAt: '2026-11-27',
  answers: {
    trains_by_default: { answer: 'no', source: { url: 'https://example.com/terms', section: '4.2 Use of Customer Data' } },
    training_opt_out: { answer: 'yes', detail: 'Training is off for all business accounts.', source: { url: 'https://example.com/terms', section: '4.3 Model Improvement' } },
    third_party_models: { answer: 'yes', detail: 'Example Model Co.', source: { url: 'https://example.com/subprocessors', section: 'Model providers' } },
    base_models_named: { answer: 'yes', detail: 'Example Model 2', source: { url: 'https://example.com/trust', section: 'Models we use' } },
    retention_period: { answer: 'yes', detail: '30 days after the matter is closed in the app', source: { url: 'https://example.com/privacy', section: '6 Retention' } },
    deletion_on_request: { answer: 'yes', detail: '30 days, backups included', source: { url: 'https://example.com/privacy', section: '7 Deletion' } },
    storage_location: { answer: 'yes', detail: 'United States', source: { url: 'https://example.com/trust', section: 'Data location' } },
    encryption: { answer: 'yes', source: { url: 'https://example.com/trust', section: 'Encryption' } },
    security_certification: { answer: 'yes', detail: 'SOC 2 Type II, report dated 2026-06-30', source: { url: 'https://example.com/trust', section: 'Audits' } },
    human_review: { answer: 'not_disclosed' },
    prompt_logging: { answer: 'yes', detail: '30 days', source: { url: 'https://example.com/privacy', section: '5 Logs' } },
    zero_data_retention: { answer: 'not_disclosed' },
    breach_notice: { answer: 'yes', detail: '72 hours', source: { url: 'https://example.com/dpa', section: '9 Security Incidents' } },
    subprocessor_list: { answer: 'yes', detail: 'https://example.com/subprocessors', source: { url: 'https://example.com/subprocessors' } },
    law_firm_terms: { answer: 'not_disclosed' },
  },
}

/**
 * Published disclosures, keyed by listing slug. Empty until a vendor sends one. Do not add a real vendor's answers
 * from memory or from a third party's summary: each answer must come from the vendor or its own published pages.
 */
export const AI_DISCLOSURES: Readonly<Record<string, AiDisclosure>> = {}

const has = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k)

/** A vendor's published disclosure, or null. Never the example: listing pages use this. */
export function getPublishedDisclosure(slug: string, registry: Readonly<Record<string, AiDisclosure>> = AI_DISCLOSURES): AiDisclosure | null {
  return has(registry, slug) ? registry[slug] : null
}

/** Like getPublishedDisclosure, but the made-up example also answers to its own slug. MCP and the memo use this. */
export function getAiDisclosure(slug: string, registry: Readonly<Record<string, AiDisclosure>> = AI_DISCLOSURES): AiDisclosure | null {
  return getPublishedDisclosure(slug, registry) ?? (slug === EXAMPLE_DISCLOSURE.slug ? EXAMPLE_DISCLOSURE : null)
}

/** Every disclosure a lawyer can build a memo from: published ones first, then the example. */
export function memoChoices(registry: Readonly<Record<string, AiDisclosure>> = AI_DISCLOSURES): AiDisclosure[] {
  return [...Object.values(registry).sort((a, b) => a.vendor.localeCompare(b.vendor)), EXAMPLE_DISCLOSURE]
}

export interface Completeness {
  total: number
  /** Fields answered yes or no. */
  answered: number
  /** Answered fields that cite a source page. */
  sourced: number
  /** Answered share, 0 to 100, rounded down so a label never overstates. */
  percent: number
  missing: FieldId[]
}

/** How much of the standard a vendor has answered. It measures disclosure, not whether the answers are good. */
export function completeness(d: AiDisclosure): Completeness {
  const total = DISCLOSURE_FIELDS.length
  let answered = 0
  let sourced = 0
  const missing: FieldId[] = []
  for (const f of DISCLOSURE_FIELDS) {
    const a = d.answers[f.id]
    if (!a || a.answer === 'not_disclosed') {
      missing.push(f.id)
      continue
    }
    answered++
    if (a.source?.url) sourced++
  }
  return { total, answered, sourced, percent: Math.floor((answered / total) * 100), missing }
}

export interface OpenQuestion {
  field: DisclosureField
  reason: 'not_disclosed' | 'flagged'
  question: string
}

/** Questions to put to the vendor: one for each field not disclosed, and one for each answer that needs a follow-up. */
export function openQuestions(d: AiDisclosure): OpenQuestion[] {
  const out: OpenQuestion[] = []
  for (const f of DISCLOSURE_FIELDS) {
    const a = d.answers[f.id]
    if (!a || a.answer === 'not_disclosed') out.push({ field: f, reason: 'not_disclosed', question: f.ask })
    else if (f.flagIf && a.answer === f.flagIf && f.flagNote) out.push({ field: f, reason: 'flagged', question: f.flagNote })
  }
  return out
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const isDate = (s: string | undefined): s is string => !!s && ISO_DATE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`))

/** The date a Reviewed label must be checked again by, or null for a self-reported one. */
export function nextReviewDue(d: AiDisclosure): string | null {
  if (d.status !== 'reviewed' || !isDate(d.reviewedAt)) return null
  const t = Date.parse(`${d.reviewedAt}T00:00:00Z`) + REVIEW_INTERVAL_DAYS * 86_400_000
  return new Date(t).toISOString().slice(0, 10)
}

function httpsUrl(s: string): boolean {
  try {
    return new URL(s).protocol === 'https:'
  } catch {
    return false
  }
}

/** Problems that stop a disclosure from being published. An empty list means it can go up. */
export function validateDisclosure(d: AiDisclosure): string[] {
  const errors: string[] = []
  if (!/^[a-z0-9-]+$/.test(d.slug)) errors.push('slug must be lowercase letters, numbers and hyphens')
  if (!d.vendor.trim()) errors.push('vendor is required')
  if (!isDate(d.publishedAt)) errors.push('publishedAt must be a YYYY-MM-DD date')
  if (d.status === 'reviewed' && !isDate(d.reviewedAt)) errors.push('a reviewed disclosure needs reviewedAt')
  if (d.status === 'self_reported' && d.reviewedAt) errors.push('a self-reported disclosure has no reviewedAt')
  for (const f of DISCLOSURE_FIELDS) {
    const a = d.answers[f.id]
    if (!a) {
      errors.push(`${f.id}: missing; use not_disclosed when the vendor says nothing`)
      continue
    }
    if (!(a.answer in ANSWER_LABELS)) errors.push(`${f.id}: answer must be yes, no or not_disclosed`)
    if (a.source && !httpsUrl(a.source.url)) errors.push(`${f.id}: source must be an https address`)
    if (a.answer === 'not_disclosed' && a.source) errors.push(`${f.id}: a not disclosed answer cannot cite a source`)
    // The Reviewed promise: every answer we checked points to the section we read.
    if (d.status === 'reviewed' && a.answer !== 'not_disclosed' && !a.source?.section) errors.push(`${f.id}: a reviewed answer needs a source and section`)
  }
  return errors
}

/** Pages the standard rests on, as read on SOURCES_READ_ON. */
export const DISCLOSURE_SOURCES: readonly { label: string; url: string }[] = [
  { label: 'LawSites on ABA Formal Opinion 512 (July 29, 2024)', url: 'https://www.lawnext.com/2024/07/in-first-ethics-ruling-on-gen-ai-aba-says-lawyers-must-have-reasonable-understanding-of-the-technology-but-need-not-become-experts.html' },
  { label: 'The Bar Examiner (NCBE), quoting Formal Opinion 512', url: 'https://thebarexaminer.ncbex.org/article/fall-2024/generative-artificial-intelligence-tools/' },
  { label: 'The Florida Bar News on Ethics Advisory Opinion 24-1', url: 'https://www.floridabar.org/the-florida-bar-news/board-of-governors-adopts-ethics-guidelines-for-generative-ai-use/' },
  { label: 'State Bar of California, Practical Guidance for Generative AI (PDF)', url: 'https://www.calbar.ca.gov/sites/default/files/portals/0/documents/ethics/Generative-AI-Practical-Guidance.pdf' },
  { label: 'Illinois ARDC, GAI Terms of Use Checklist', url: 'https://iardc.org/Files/Implementing-AI-Guide/inc/html/39.html' },
  { label: 'Law.com (2021) on a 1,400-question law firm audit questionnaire', url: 'https://law.com/legaltechnews/2021/06/25/more-demanding-cyber-audits-can-push-legal-service-providers-to-their-tipping-point' },
]
