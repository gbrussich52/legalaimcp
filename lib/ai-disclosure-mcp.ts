// classification: PUBLIC
// Claude Opus 5.5, 2026-11-27: the shape get_ai_disclosure returns over MCP. It carries the same answers, sources and
// duty mapping the /ai-disclosure label shows, so an assistant never gets an answer without its source or its status.
import { z } from 'zod'
import { SITE_URL } from './constants'
import {
  ANSWER_LABELS,
  DISCLOSURE_FIELDS,
  DUTIES,
  ILLINOIS_ITEMS,
  completeness,
  nextReviewDue,
  type AiDisclosure,
  type FieldAnswer,
} from './ai-disclosure'

export const STANDARD_URL = `${SITE_URL}/ai-disclosure`

export const DisclosureFieldSchema = z.object({
  id: z.string(),
  label: z.string().describe('The statement the vendor answered'),
  answer: z.enum(['yes', 'no', 'not_disclosed']),
  answer_label: z.string(),
  detail: z.string().nullable().describe('Names, periods, dates or places the vendor gave with a yes'),
  source_url: z.string().nullable().describe('The vendor page the answer comes from'),
  source_section: z.string().nullable(),
  duties: z.array(z.string()).describe('Lawyer duties this answer bears on (ABA Formal Op. 512)'),
  illinois_checklist: z.array(z.string()).describe('Matching items in the Illinois ARDC GAI Terms of Use Checklist'),
})

export const DisclosureSchema = z.object({
  slug: z.string(),
  vendor: z.string(),
  product: z.string(),
  fictional: z.boolean().describe('True only for the made-up Example Vendor, Inc.'),
  status: z.enum(['self_reported', 'reviewed']).describe('self_reported: published as the vendor sent it, not checked by us. reviewed: we checked each answer against the vendor\'s own pages on reviewed_at.'),
  published_at: z.string(),
  reviewed_at: z.string().nullable(),
  next_review_due: z.string().nullable(),
  completeness: z.object({
    answered: z.number(),
    total: z.number(),
    sourced: z.number(),
    percent: z.number().describe('Share of fields answered yes or no. It measures disclosure, not quality.'),
  }),
  fields: z.array(DisclosureFieldSchema),
  standard_url: z.string(),
  not_legal_advice: z.literal(true),
})

export function toMcpDisclosure(d: AiDisclosure): z.infer<typeof DisclosureSchema> {
  const c = completeness(d)
  return {
    slug: d.slug,
    vendor: d.vendor,
    product: d.product,
    fictional: Boolean(d.fictional),
    status: d.status,
    published_at: d.publishedAt,
    reviewed_at: d.reviewedAt ?? null,
    next_review_due: nextReviewDue(d),
    completeness: { answered: c.answered, total: c.total, sourced: c.sourced, percent: c.percent },
    fields: DISCLOSURE_FIELDS.map((f) => {
      const a: FieldAnswer = d.answers[f.id] ?? { answer: 'not_disclosed' }
      return {
        id: f.id,
        label: f.label,
        answer: a.answer,
        answer_label: ANSWER_LABELS[a.answer],
        detail: a.detail ?? null,
        source_url: a.source?.url ?? null,
        source_section: a.source?.section ?? null,
        duties: f.duties.map((id) => DUTIES[id].label),
        illinois_checklist: f.illinois.map((id) => ILLINOIS_ITEMS[id]),
      }
    }),
    standard_url: STANDARD_URL,
    not_legal_advice: true,
  }
}

/** Plain text for clients that show prose. */
export function formatDisclosure(d: AiDisclosure): string {
  const c = completeness(d)
  const status = d.status === 'reviewed'
    ? `Reviewed by LegalAIMCP on ${d.reviewedAt}`
    : 'Self-reported by the vendor. LegalAIMCP has not checked these answers.'
  const lines = [
    `AI Disclosure: ${d.product} (${d.vendor})${d.fictional ? '. FICTIONAL EXAMPLE, not a real vendor.' : ''}`,
    status,
    `Answered ${c.answered} of ${c.total} fields.`,
    '',
    ...DISCLOSURE_FIELDS.map((f) => {
      const a: FieldAnswer = d.answers[f.id] ?? { answer: 'not_disclosed' }
      const detail = a.detail ? ` (${a.detail})` : ''
      const src = a.source ? ` Source: ${a.source.url}${a.source.section ? `, ${a.source.section}` : ''}` : ''
      return `- ${f.label}: ${ANSWER_LABELS[a.answer]}${detail}.${src}`
    }),
    '',
    `The standard and the duty behind each field: ${STANDARD_URL}. Not legal advice; check your own state's rules.`,
  ]
  return lines.join('\n')
}
