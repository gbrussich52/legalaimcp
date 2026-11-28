// Claude Opus 5.5, 2026-11-27: the AI Disclosure schema, its score, its memo questions and its publish rules.
import { describe, expect, it } from 'vitest'
import {
  AI_DISCLOSURES,
  DISCLOSURE_FIELDS,
  DUTIES,
  EXAMPLE_DISCLOSURE,
  ILLINOIS_ITEMS,
  REVIEWED_MAILTO,
  REVIEWED_PRICE_USD,
  REVIEW_INTERVAL_DAYS,
  completeness,
  getAiDisclosure,
  getPublishedDisclosure,
  memoChoices,
  nextReviewDue,
  openQuestions,
  validateDisclosure,
  type AiDisclosure,
} from './ai-disclosure'
import { toMcpDisclosure } from './ai-disclosure-mcp'

const allNotDisclosed = (): AiDisclosure['answers'] =>
  Object.fromEntries(DISCLOSURE_FIELDS.map((f) => [f.id, { answer: 'not_disclosed' }])) as AiDisclosure['answers']

const blank = (over: Partial<AiDisclosure> = {}): AiDisclosure => ({
  slug: 'fixture-vendor',
  vendor: 'Fixture Co.',
  product: 'Fixture',
  status: 'self_reported',
  publishedAt: '2026-11-27',
  answers: allNotDisclosed(),
  ...over,
})

describe('schema', () => {
  it('has the fifteen fields, each id unique, each mapped to at least one duty', () => {
    expect(DISCLOSURE_FIELDS).toHaveLength(15)
    expect(new Set(DISCLOSURE_FIELDS.map((f) => f.id)).size).toBe(15)
    for (const f of DISCLOSURE_FIELDS) {
      expect(f.duties.length, f.id).toBeGreaterThan(0)
      for (const d of f.duties) expect(DUTIES[d], `${f.id} -> ${d}`).toBeTruthy()
      for (const i of f.illinois) expect(ILLINOIS_ITEMS[i], `${f.id} -> ${i}`).toBeTruthy()
      expect(f.ask.endsWith('?'), f.id).toBe(true)
      if (f.flagIf) expect(f.flagNote, f.id).toBeTruthy()
    }
  })
  it('covers every ABA 512 duty and the four Illinois items the brief names', () => {
    const duties = new Set(DISCLOSURE_FIELDS.flatMap((f) => f.duties))
    expect([...duties].sort()).toEqual(['competence', 'confidentiality', 'informed_consent', 'supervision'])
    const il = new Set(DISCLOSURE_FIELDS.flatMap((f) => f.illinois))
    for (const id of ['no_model_training', 'purpose_limitation', 'data_retention', 'third_party_access'] as const) expect(il.has(id), id).toBe(true)
  })
  it('maps training on customer data to informed consent for self-learning tools', () => {
    const f = DISCLOSURE_FIELDS.find((x) => x.id === 'trains_by_default')!
    expect(f.duties).toContain('informed_consent')
    expect(f.illinois).toContain('no_model_training')
    expect(f.flagIf).toBe('yes')
  })
})

describe('registry', () => {
  it('seeds no real vendor; the only shown vendor is the labeled fictional example', () => {
    expect(Object.keys(AI_DISCLOSURES)).toEqual([])
    expect(EXAMPLE_DISCLOSURE.fictional).toBe(true)
    expect(EXAMPLE_DISCLOSURE.vendor).toBe('Example Vendor, Inc.')
    for (const a of Object.values(EXAMPLE_DISCLOSURE.answers)) if (a.source) expect(new URL(a.source.url).hostname).toBe('example.com')
  })
  it('every published disclosure passes validation', () => {
    for (const d of [...Object.values(AI_DISCLOSURES), EXAMPLE_DISCLOSURE]) expect(validateDisclosure(d), d.slug).toEqual([])
  })
  it('getPublishedDisclosure never returns the example; getAiDisclosure returns it only for its own slug', () => {
    expect(getPublishedDisclosure('example-vendor')).toBeNull()
    expect(getAiDisclosure('example-vendor')).toBe(EXAMPLE_DISCLOSURE)
    expect(getAiDisclosure('harvey-mcp')).toBeNull()
  })
  it('ignores object prototype names as slugs', () => {
    for (const s of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
      expect(getPublishedDisclosure(s), s).toBeNull()
      expect(getAiDisclosure(s), s).toBeNull()
    }
  })
  it('finds a vendor in a supplied registry and lists memo choices with the example last', () => {
    const d = blank()
    expect(getPublishedDisclosure('fixture-vendor', { 'fixture-vendor': d })).toBe(d)
    const choices = memoChoices({ 'fixture-vendor': d })
    expect(choices.map((c) => c.slug)).toEqual(['fixture-vendor', 'example-vendor'])
  })
})

describe('completeness', () => {
  it('scores 0 when nothing is disclosed and lists every field as missing', () => {
    const c = completeness(blank())
    expect(c).toMatchObject({ total: 15, answered: 0, sourced: 0, percent: 0 })
    expect(c.missing).toHaveLength(15)
  })
  it('counts yes and no alike, since it measures disclosure, not quality', () => {
    const answers = allNotDisclosed()
    answers.trains_by_default = { answer: 'yes', source: { url: 'https://example.com/t' } }
    answers.training_opt_out = { answer: 'no' }
    const c = completeness(blank({ answers }))
    expect(c.answered).toBe(2)
    expect(c.sourced).toBe(1)
    expect(c.percent).toBe(13) // 2 of 15 is 13.3; rounded down so the label never overstates
  })
  it('scores the example at 12 of 15', () => {
    const c = completeness(EXAMPLE_DISCLOSURE)
    expect(c.answered).toBe(12)
    expect(c.percent).toBe(80)
    expect(c.missing).toEqual(['human_review', 'zero_data_retention', 'law_firm_terms'])
  })
  it('reaches 100 only when every field is answered', () => {
    const answers = Object.fromEntries(DISCLOSURE_FIELDS.map((f) => [f.id, { answer: 'no' }])) as AiDisclosure['answers']
    expect(completeness(blank({ answers })).percent).toBe(100)
  })
})

describe('openQuestions', () => {
  it('asks the vendor about each field not disclosed', () => {
    const q = openQuestions(blank())
    expect(q).toHaveLength(15)
    expect(q.every((x) => x.reason === 'not_disclosed')).toBe(true)
  })
  it('adds a follow-up for an answer that needs one, such as training on by default', () => {
    const answers = allNotDisclosed()
    answers.trains_by_default = { answer: 'yes' }
    const q = openQuestions(blank({ answers })).find((x) => x.field.id === 'trains_by_default')!
    expect(q.reason).toBe('flagged')
    expect(q.question).toMatch(/informed client consent/)
  })
  it('asks nothing about a disclosed answer that needs no follow-up', () => {
    const answers = allNotDisclosed()
    answers.trains_by_default = { answer: 'no' }
    expect(openQuestions(blank({ answers })).some((x) => x.field.id === 'trains_by_default')).toBe(false)
  })
})

describe('validateDisclosure', () => {
  it('rejects a reviewed disclosure without a review date', () => {
    expect(validateDisclosure(blank({ status: 'reviewed' }))).toContain('a reviewed disclosure needs reviewedAt')
  })
  it('rejects a reviewed answer that does not cite a source section', () => {
    const answers = allNotDisclosed()
    answers.encryption = { answer: 'yes', source: { url: 'https://example.com/trust' } }
    const errs = validateDisclosure(blank({ status: 'reviewed', reviewedAt: '2026-11-27', answers }))
    expect(errs).toContain('encryption: a reviewed answer needs a source and section')
  })
  it('rejects a source that is not https, and a source on a not disclosed answer', () => {
    const answers = allNotDisclosed()
    answers.encryption = { answer: 'yes', source: { url: 'http://example.com/trust' } }
    answers.human_review = { answer: 'not_disclosed', source: { url: 'https://example.com/x' } }
    const errs = validateDisclosure(blank({ answers }))
    expect(errs).toContain('encryption: source must be an https address')
    expect(errs).toContain('human_review: a not disclosed answer cannot cite a source')
    answers.encryption = { answer: 'yes', source: { url: 'javascript:alert(1)' } }
    expect(validateDisclosure(blank({ answers }))).toContain('encryption: source must be an https address')
  })
  it('rejects a missing field, a bad slug and a self-reported label with a review date', () => {
    const answers = allNotDisclosed() as Partial<AiDisclosure['answers']>
    delete answers.breach_notice
    const errs = validateDisclosure(blank({ slug: 'Bad Slug', reviewedAt: '2026-11-27', answers: answers as AiDisclosure['answers'] }))
    expect(errs.some((e) => e.startsWith('breach_notice: missing'))).toBe(true)
    expect(errs).toContain('slug must be lowercase letters, numbers and hyphens')
    expect(errs).toContain('a self-reported disclosure has no reviewedAt')
  })
})

describe('Reviewed tier', () => {
  it('costs $1,200 a year, re-checks every 90 days, and goes to email, not checkout', () => {
    expect(REVIEWED_PRICE_USD).toBe(1200)
    expect(REVIEW_INTERVAL_DAYS).toBe(90)
    expect(REVIEWED_MAILTO.startsWith('mailto:hello@legalaimcp.com?subject=')).toBe(true)
  })
  it('sets the next review 90 days after the last, and none for a self-reported label', () => {
    expect(nextReviewDue(blank({ status: 'reviewed', reviewedAt: '2026-11-27' }))).toBe('2027-02-25')
    expect(nextReviewDue(blank())).toBeNull()
  })
})

describe('MCP shape', () => {
  it('carries every field with its source, duties and the fictional flag', () => {
    const m = toMcpDisclosure(EXAMPLE_DISCLOSURE)
    expect(m.fields).toHaveLength(15)
    expect(m.fictional).toBe(true)
    expect(m.not_legal_advice).toBe(true)
    expect(m.standard_url).toBe('https://legalaimcp.com/ai-disclosure')
    expect(m.fields.find((f) => f.id === 'human_review')).toMatchObject({ answer: 'not_disclosed', source_url: null })
  })
})
