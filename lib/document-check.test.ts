import { describe, expect, it } from 'vitest'
import {
  DOCUMENT_CHECK_CLEAN_EXAMPLE,
  DOCUMENT_CHECK_EXAMPLE,
  documentCheckInputJsonSchema,
  parseDocumentCheckInput,
  reconcileDocuments,
} from './document-check'

const clean = () => structuredClone(DOCUMENT_CHECK_CLEAN_EXAMPLE)
const deficient = () => structuredClone(DOCUMENT_CHECK_EXAMPLE)
const valid = () => ({ requested: [{ id: 'r1', name: 'Agreement' }], received: [] })

describe('document metadata parser', () => {
  it('parses the clean example and returns a detached value', () => {
    const parsed = parseDocumentCheckInput(clean())
    expect(parsed).toEqual(DOCUMENT_CHECK_CLEAN_EXAMPLE)
    expect(parsed).not.toBe(DOCUMENT_CHECK_CLEAN_EXAMPLE)
    expect(parsed.requested[0]).not.toBe(DOCUMENT_CHECK_CLEAN_EXAMPLE.requested[0])
  })

  it('normalizes party case and whitespace and blank party to absent', () => {
    const parsed = parseDocumentCheckInput({ requested: [{ id: 'r1', name: 'Agreement', party: '  ACME   LLP  ' }, { id: 'r2', name: 'Other', party: '   ' }], received: [] })
    expect(parsed.requested[0].party).toBe('ACME LLP')
    expect(parsed.requested[1]).toEqual({ id: 'r2', name: 'Other' })
  })

  it.each([
    ['empty input', {}],
    ['null input', null],
    ['array input', []],
    ['requested empty', { requested: [], received: [] }],
    ['received not array', { requested: [{ id: 'r1', name: 'A' }], received: {} }],
    ['unknown root key', { requested: [{ id: 'r1', name: 'A' }], received: [], extra: true }],
  ])('rejects %s with a public-safe error', (_label, value) => {
    expect(() => parseDocumentCheckInput(value)).toThrow('Invalid document check input.')
  })

  it('does not include input values in parser errors', () => {
    const secret = 'CLIENT-SECRET-123'
    let error: unknown
    try {
      parseDocumentCheckInput({ requested: [{ id: secret, name: 'A' }], received: [] })
    } catch (caught) {
      error = caught
    }
    expect(String(error)).not.toContain(secret)
  })

  it.each([
    '2025-02-29',
    '2025-02-30',
    '2025-13-01',
    '2025-00-01',
    '2025-1-01',
    'not-a-date',
  ])('rejects invalid real date %s', (date) => {
    expect(() => parseDocumentCheckInput({ requested: [{ id: 'r1', name: 'A', periodStart: date, periodEnd: '2025-12-31' }], received: [] })).toThrow()
  })

  it('accepts leap day only in a leap year', () => {
    expect(parseDocumentCheckInput({ requested: [{ id: 'r1', name: 'A', periodStart: '2024-02-29', periodEnd: '2024-02-29' }], received: [] }).requested[0].periodStart).toBe('2024-02-29')
  })

  it('requires a complete ordered requested period', () => {
    expect(() => parseDocumentCheckInput({ requested: [{ id: 'r1', name: 'A', periodStart: '2025-01-01' }], received: [] })).toThrow()
    expect(() => parseDocumentCheckInput({ requested: [{ id: 'r1', name: 'A', periodStart: '2025-12-31', periodEnd: '2025-01-01' }], received: [] })).toThrow()
  })

  it('allows a partial received period at the parser boundary', () => {
    const parsed = parseDocumentCheckInput({ requested: [{ id: 'r1', name: 'A', periodStart: '2025-01-01', periodEnd: '2025-12-31' }], received: [{ id: 'd1', requestId: 'r1', name: 'A', periodStart: '2025-01-01' }] })
    expect(parsed.received[0].periodEnd).toBeUndefined()
  })

  it.each(['id', 'name'])('rejects a blank or oversized %s', (field) => {
    const value = field === 'id' ? { requested: [{ id: ' '.repeat(1), name: 'A' }], received: [] } : { requested: [{ id: 'r1', name: ' '.repeat(121) }], received: [] }
    expect(() => parseDocumentCheckInput(value)).toThrow()
  })

  it('enforces identifier, metadata number, and list bounds', () => {
    expect(() => parseDocumentCheckInput({ requested: [{ id: 'bad id', name: 'A' }], received: [] })).toThrow()
    expect(() => parseDocumentCheckInput({ requested: [{ id: 'r1', name: 'A', version: 0 }], received: [] })).toThrow()
    expect(() => parseDocumentCheckInput({ requested: [{ id: 'r1', name: 'A', pages: 1.5 }], received: [] })).toThrow()
    expect(() => parseDocumentCheckInput({ requested: [{ id: 'r1', name: 'A', pages: 10001 }], received: [] })).toThrow()
    expect(() => parseDocumentCheckInput({ requested: Array.from({ length: 21 }, (_, i) => ({ id: `r${i}`, name: 'A' })), received: [] })).toThrow()
    expect(() => parseDocumentCheckInput({ requested: [{ id: 'r1', name: 'A' }], received: Array.from({ length: 41 }, (_, i) => ({ id: `d${i}`, requestId: null, name: 'A' })) })).toThrow()
  })

  it('rejects duplicate IDs and unknown explicit associations', () => {
    expect(() => parseDocumentCheckInput({ requested: [{ id: 'r1', name: 'A' }, { id: 'r1', name: 'B' }], received: [] })).toThrow()
    expect(() => parseDocumentCheckInput({ requested: [{ id: 'r1', name: 'A' }], received: [{ id: 'd1', requestId: 'missing', name: 'A' }] })).toThrow()
  })

  it('rejects non-plain objects and unknown nested keys', () => {
    expect(() => parseDocumentCheckInput({ requested: [Object.assign(Object.create({ inherited: true }), { id: 'r1', name: 'A' })], received: [] })).toThrow()
    expect(() => parseDocumentCheckInput({ requested: [{ id: 'r1', name: 'A', typo: true }], received: [] })).toThrow()
    expect(() => parseDocumentCheckInput({ requested: [{ id: 'r1', name: 'A' }], received: [{ id: 'd1', requestId: null, name: 'A', typo: true }] })).toThrow()
  })
})

describe('document reconciliation', () => {
  it('reports the clean example exactly as no issues', () => {
    const result = reconcileDocuments(clean())
    expect(result.status).toBe('no_issues_found')
    expect(result.summary).toEqual({ requested: 3, received: 3, missing: 0, needsReview: 0, matched: 3 })
    expect(result.items.map((item) => item.status)).toEqual(['matched', 'matched', 'matched'])
    expect(result.unassignedIds).toEqual([])
    expect(result.items.every((item) => item.findings.length === 0)).toBe(true)
  })

  it('reports the deficient example with missing, duplicate, and unassigned findings', () => {
    const result = reconcileDocuments(deficient())
    expect(result.status).toBe('needs_review')
    expect(result.summary).toEqual({ requested: 3, received: 4, missing: 1, needsReview: 2, matched: 0 })
    expect(result.items[0].findings.map((item) => item.code)).toEqual(expect.arrayContaining(['PERIOD_MISMATCH', 'VERSION_OLDER', 'PAGES_MISMATCH']))
    expect(result.items[1].findings.map((item) => item.code)).toContain('DUPLICATE_ASSOCIATION')
    expect(result.items[2].status).toBe('missing')
    expect(result.items[2].findings[0].code).toBe('DOCUMENT_MISSING')
    expect(result.unassignedIds).toEqual(['received-unassigned'])
  })

  it('associates only by explicit requestId and does not fuzzy match names', () => {
    const result = reconcileDocuments({ requested: [{ id: 'r1', name: 'Agreement', party: 'acme' }], received: [{ id: 'd1', requestId: null, name: 'Agreement', party: 'ACME' }] })
    expect(result.items[0].status).toBe('missing')
    expect(result.unassignedIds).toEqual(['d1'])
  })

  it('matches parties after case and whitespace normalization', () => {
    const result = reconcileDocuments({ requested: [{ id: 'r1', name: 'Agreement', party: 'Acme LLC' }], received: [{ id: 'd1', requestId: 'r1', name: 'Agreement', party: '  ACME   LLC ' }] })
    expect(result.items[0].status).toBe('matched')
  })

  it('flags every expected field missing from received metadata', () => {
    const result = reconcileDocuments({ requested: [{ id: 'r1', name: 'Agreement', party: 'Acme', periodStart: '2025-01-01', periodEnd: '2025-12-31', version: 2, pages: 4 }], received: [{ id: 'd1', requestId: 'r1', name: 'Agreement' }] })
    expect(result.items[0].findings.map((item) => item.code)).toEqual(expect.arrayContaining(['PARTY_MISSING', 'PERIOD_START_MISSING', 'PERIOD_END_MISSING', 'VERSION_MISSING', 'PAGES_MISSING']))
    expect(result.items[0].status).toBe('needs_review')
  })

  it('ignores received optional metadata when the request omits it', () => {
    const result = reconcileDocuments({ requested: [{ id: 'r1', name: 'Agreement' }], received: [{ id: 'd1', requestId: 'r1', name: 'Agreement', party: 'Different', periodStart: '2025-01-01', periodEnd: '2025-02-01', version: 4, pages: 99 }] })
    expect(result.items[0]).toMatchObject({ status: 'matched', findings: [] })
  })

  it('flags parties, periods, versions, and pages that differ', () => {
    const result = reconcileDocuments({ requested: [{ id: 'r1', name: 'Agreement', party: 'Acme', periodStart: '2025-01-01', periodEnd: '2025-12-31', version: 2, pages: 4 }], received: [{ id: 'd1', requestId: 'r1', name: 'Different filename', party: 'Other', periodStart: '2024-01-01', periodEnd: '2024-12-31', version: 3, pages: 5 }] })
    expect(result.items[0].findings.map((item) => item.code)).toEqual(expect.arrayContaining(['PARTY_MISMATCH', 'PERIOD_MISMATCH', 'VERSION_NEWER', 'PAGES_MISMATCH']))
  })

  it('does not treat a received filename difference as a metadata issue', () => {
    const result = reconcileDocuments({ requested: [{ id: 'r1', name: 'Agreement' }], received: [{ id: 'd1', requestId: 'r1', name: 'agreement-signed.pdf' }] })
    expect(result.items[0]).toMatchObject({ status: 'matched', findings: [] })
  })

  it('flags a reversed received period even when no period was requested', () => {
    const result = reconcileDocuments({ requested: [{ id: 'r1', name: 'Agreement' }], received: [{ id: 'd1', requestId: 'r1', name: 'Agreement', periodStart: '2025-12-31', periodEnd: '2025-01-01' }] })
    expect(result.items[0].findings.map((item) => item.code)).toContain('PERIOD_INVALID_ORDER')
    expect(result.items[0].status).toBe('needs_review')
  })

  it('flags duplicate explicit associations even when metadata agrees', () => {
    const result = reconcileDocuments({ requested: [{ id: 'r1', name: 'Agreement' }], received: [{ id: 'd1', requestId: 'r1', name: 'Agreement' }, { id: 'd2', requestId: 'r1', name: 'Agreement' }] })
    expect(result.items[0]).toMatchObject({ status: 'needs_review', receivedIds: ['d1', 'd2'] })
    expect(result.items[0].findings).toEqual([{ code: 'DUPLICATE_ASSOCIATION', message: expect.any(String), field: 'requestId' }])
  })

  it('counts an empty received list as missing requests', () => {
    const result = reconcileDocuments(valid())
    expect(result.summary).toEqual({ requested: 1, received: 0, missing: 1, needsReview: 0, matched: 0 })
    expect(result.status).toBe('needs_review')
  })

  it('returns detached result arrays and does not mutate input', () => {
    const input = clean()
    const before = structuredClone(input)
    const result = reconcileDocuments(input)
    result.items[0].receivedIds.push('invented')
    result.limitations.push('invented')
    expect(input).toEqual(before)
    const again = reconcileDocuments(input)
    expect(again.items[0].receivedIds).not.toContain('invented')
    expect(again.limitations).not.toContain('invented')
  })

  it('is deterministic across repeated calls', () => {
    const input = deficient()
    expect(reconcileDocuments(input)).toEqual(reconcileDocuments(input))
  })

  it('exposes a strict nested JSON Schema with the contract bounds', () => {
    expect(documentCheckInputJsonSchema.additionalProperties).toBe(false)
    expect(documentCheckInputJsonSchema.properties.requested.maxItems).toBe(20)
    expect(documentCheckInputJsonSchema.properties.received.maxItems).toBe(40)
    expect(documentCheckInputJsonSchema.properties.requested.items.additionalProperties).toBe(false)
    expect(documentCheckInputJsonSchema.properties.received.items.required).toContain('requestId')
    expect(documentCheckInputJsonSchema.properties.received.items.additionalProperties).toBe(false)
  })
})
