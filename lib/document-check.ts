/**
 * Browser-safe metadata reconciliation for a fictional document collection
 * workflow. This module never reads document contents or contacts a service.
 */

export type DocumentMetadata = {
  id: string
  name: string
  party?: string
  periodStart?: string
  periodEnd?: string
  version?: number
  pages?: number
}

export type RequestedDocument = DocumentMetadata

export type ReceivedDocument = DocumentMetadata & { requestId: string | null }

export type DocumentCheckInput = {
  requested: RequestedDocument[]
  received: ReceivedDocument[]
}

type Finding = { code: string; message: string; field: string }
type CheckItem = {
  requestId: string
  name: string
  status: 'matched' | 'missing' | 'needs_review'
  receivedIds: string[]
  findings: Finding[]
}
export type DocumentCheckResult = {
  status: 'no_issues_found' | 'needs_review'
  items: CheckItem[]
  unassignedIds: string[]
  summary: {
    requested: number
    received: number
    missing: number
    needsReview: number
    matched: number
  }
  limitations: string[]
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const METADATA_KEYS = ['id', 'name', 'party', 'periodStart', 'periodEnd', 'version', 'pages'] as const
const RECEIVED_KEYS = [...METADATA_KEYS, 'requestId'] as const

const LIMITATIONS = [
  'Metadata reconciliation only; this result does not assess legal sufficiency, authenticity, or completeness.',
  'The check uses explicit associations and user-entered metadata; it does not inspect document contents or infer relationships.',
  'Optional expected metadata fields that are omitted are not checked.',
]

function invalid(): never {
  throw new Error('Invalid document check input.')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  if (Object.getPrototypeOf(value) !== Object.prototype) return false
  return Reflect.ownKeys(value).every((key) => typeof key === 'string' && Object.getOwnPropertyDescriptor(value, key)?.get === undefined && Object.getOwnPropertyDescriptor(value, key)?.set === undefined)
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]) {
  const keys = Reflect.ownKeys(value)
  return keys.every((key) => typeof key === 'string' && allowed.includes(key)) && keys.length <= allowed.length
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && Object.getPrototypeOf(value) === Array.prototype
}

function validDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  const day = Number(value.slice(8, 10))
  if (year < 1 || month < 1 || month > 12 || day < 1) return false
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return day <= days[month - 1]
}

function normalizeParty(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function partyKey(value: string) {
  return normalizeParty(value).toLowerCase()
}

function parseMetadata(value: unknown, received: boolean): DocumentMetadata | ReceivedDocument {
  if (!isRecord(value) || !hasOnlyKeys(value, received ? RECEIVED_KEYS : METADATA_KEYS)) invalid()

  const id = value.id
  const name = value.name
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) invalid()
  if (typeof name !== 'string') invalid()
  const trimmedName = name.trim()
  if (trimmedName.length === 0 || trimmedName.length > 120) invalid()

  const output: DocumentMetadata = { id, name: trimmedName }
  if ('party' in value) {
    if (typeof value.party !== 'string') invalid()
    const party = normalizeParty(value.party)
    if (party.length > 200) invalid()
    if (party) output.party = party
  }
  for (const field of ['periodStart', 'periodEnd'] as const) {
    if (field in value) {
      if (typeof value[field] !== 'string' || !validDate(value[field])) invalid()
      output[field] = value[field]
    }
  }
  if (('periodStart' in value) !== ('periodEnd' in value)) {
    if (!received) invalid()
  }
  for (const field of ['version', 'pages'] as const) {
    if (field in value) {
      const number = value[field]
      if (typeof number !== 'number' || !Number.isInteger(number) || number < 1 || number > 10000) invalid()
      output[field] = number
    }
  }

  if (!received) return output
  const requestId = value.requestId
  if (requestId !== null && (typeof requestId !== 'string' || !ID_PATTERN.test(requestId))) invalid()
  return { ...output, requestId }
}

/** Parse and normalize a user-editable metadata payload into a detached value. */
export function parseDocumentCheckInput(value: unknown): DocumentCheckInput {
  if (!isRecord(value) || !hasOnlyKeys(value, ['requested', 'received']) || !('requested' in value) || !('received' in value)) invalid()
  if (!isArray(value.requested) || value.requested.length < 1 || value.requested.length > 20) invalid()
  if (!isArray(value.received) || value.received.length > 40) invalid()

  const requested = value.requested.map((entry) => parseMetadata(entry, false) as RequestedDocument)
  const received = value.received.map((entry) => parseMetadata(entry, true) as ReceivedDocument)
  const requestedIds = new Set<string>()
  for (const document of requested) {
    if (requestedIds.has(document.id)) invalid()
    requestedIds.add(document.id)
    if (document.periodStart && document.periodEnd && document.periodStart > document.periodEnd) invalid()
  }
  const receivedIds = new Set<string>()
  for (const document of received) {
    if (receivedIds.has(document.id)) invalid()
    receivedIds.add(document.id)
    if (document.requestId !== null && !requestedIds.has(document.requestId)) invalid()
  }
  return { requested, received }
}

function finding(code: string, message: string, field: string): Finding {
  return { code, message, field }
}

function compareDocument(requested: RequestedDocument, received: ReceivedDocument) {
  const findings: Finding[] = []
  const add = (code: string, message: string, field: string) => {
    if (!findings.some((item) => item.code === code && item.field === field)) findings.push(finding(code, message, field))
  }

  if (requested.party !== undefined) {
    if (received.party === undefined) add('PARTY_MISSING', 'The requested party is missing from the received metadata.', 'party')
    else if (partyKey(received.party) !== partyKey(requested.party)) add('PARTY_MISMATCH', 'The received party does not match the requested metadata.', 'party')
  }
  if (received.periodStart !== undefined && received.periodEnd !== undefined && received.periodStart > received.periodEnd) {
    add('PERIOD_INVALID_ORDER', 'The received period start is later than its end.', 'period')
  }
  if (requested.periodStart !== undefined && requested.periodEnd !== undefined) {
    if (received.periodStart === undefined) add('PERIOD_START_MISSING', 'The requested period start is missing from the received metadata.', 'periodStart')
    if (received.periodEnd === undefined) add('PERIOD_END_MISSING', 'The requested period end is missing from the received metadata.', 'periodEnd')
    if (received.periodStart !== undefined && received.periodEnd !== undefined && (received.periodStart !== requested.periodStart || received.periodEnd !== requested.periodEnd)) {
      add('PERIOD_MISMATCH', 'The received period does not match the requested metadata.', 'period')
    }
  }
  if (requested.version !== undefined) {
    if (received.version === undefined) add('VERSION_MISSING', 'The requested version is missing from the received metadata.', 'version')
    else if (received.version < requested.version) add('VERSION_OLDER', 'The received document is older than the requested version.', 'version')
    else if (received.version > requested.version) add('VERSION_NEWER', 'The received document is newer than the requested version.', 'version')
  }
  if (requested.pages !== undefined) {
    if (received.pages === undefined) add('PAGES_MISSING', 'The requested page count is missing from the received metadata.', 'pages')
    else if (received.pages !== requested.pages) add('PAGES_MISMATCH', 'The received page count does not match the requested metadata.', 'pages')
  }
  return findings
}

/** Reconcile explicit request associations without inspecting document contents. */
export function reconcileDocuments(value: unknown): DocumentCheckResult {
  const input = parseDocumentCheckInput(value)
  const items: CheckItem[] = []
  for (const requested of input.requested) {
    const matches = input.received.filter((document) => document.requestId === requested.id)
    const receivedIds = matches.map((document) => document.id)
    const findings: Finding[] = []
    if (matches.length === 0) {
      findings.push(finding('DOCUMENT_MISSING', 'No received document is explicitly associated with this request.', 'requestId'))
    } else {
      for (const document of matches) {
        for (const item of compareDocument(requested, document)) {
          if (!findings.some((existing) => existing.code === item.code && existing.field === item.field)) findings.push(item)
        }
      }
      if (matches.length > 1) findings.push(finding('DUPLICATE_ASSOCIATION', 'Multiple received documents are explicitly associated with this request; review which one is authoritative.', 'requestId'))
    }
    const status: CheckItem['status'] = matches.length === 0 ? 'missing' : findings.length > 0 ? 'needs_review' : 'matched'
    items.push({ requestId: requested.id, name: requested.name, status, receivedIds, findings })
  }

  const unassignedIds = input.received.filter((document) => document.requestId === null).map((document) => document.id)
  const missing = items.filter((item) => item.status === 'missing').length
  const needsReview = items.filter((item) => item.status === 'needs_review').length
  const matched = items.filter((item) => item.status === 'matched').length
  return {
    status: missing === 0 && needsReview === 0 && unassignedIds.length === 0 ? 'no_issues_found' : 'needs_review',
    items,
    unassignedIds,
    summary: { requested: input.requested.length, received: input.received.length, missing, needsReview, matched },
    limitations: [...LIMITATIONS],
  }
}

const REQUESTED_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string', minLength: 1, maxLength: 64, pattern: '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$' },
    name: { type: 'string', minLength: 1, maxLength: 120 },
    party: { type: 'string', maxLength: 200 },
    periodStart: { type: 'string', format: 'date', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    periodEnd: { type: 'string', format: 'date', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    version: { type: 'integer', minimum: 1, maximum: 10000 },
    pages: { type: 'integer', minimum: 1, maximum: 10000 },
  },
  required: ['id', 'name'],
  additionalProperties: false,
  anyOf: [
    { not: { anyOf: [{ required: ['periodStart'] }, { required: ['periodEnd'] }] } },
    { required: ['periodStart', 'periodEnd'] },
  ],
} as const

const RECEIVED_SCHEMA = {
  type: 'object',
  properties: { ...REQUESTED_SCHEMA.properties, requestId: { anyOf: [{ type: 'string', minLength: 1, maxLength: 64, pattern: '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$' }, { type: 'null' }] } },
  required: ['id', 'name', 'requestId'],
  additionalProperties: false,
} as const

export const documentCheckInputJsonSchema = {
  type: 'object',
  properties: {
    requested: { type: 'array', minItems: 1, maxItems: 20, items: REQUESTED_SCHEMA },
    received: { type: 'array', maxItems: 40, items: RECEIVED_SCHEMA },
  },
  required: ['requested', 'received'],
  additionalProperties: false,
} as const

export const DOCUMENT_CHECK_CLEAN_EXAMPLE: DocumentCheckInput = {
  requested: [
    { id: 'request-deed', name: 'Recorded deed', party: 'Avery Stone', periodStart: '2025-01-01', periodEnd: '2025-12-31', version: 2, pages: 2 },
    { id: 'request-lease', name: 'Lease agreement', party: 'Northwind Rentals', periodStart: '2025-01-01', periodEnd: '2025-12-31', version: 2, pages: 4 },
    { id: 'request-identity', name: 'Identity statement', party: 'Avery Stone', version: 1, pages: 1 },
  ],
  received: [
    { id: 'received-deed', requestId: 'request-deed', name: 'Recorded deed', party: 'Avery Stone', periodStart: '2025-01-01', periodEnd: '2025-12-31', version: 2, pages: 2 },
    { id: 'received-lease', requestId: 'request-lease', name: 'Lease agreement', party: 'Northwind Rentals', periodStart: '2025-01-01', periodEnd: '2025-12-31', version: 2, pages: 4 },
    { id: 'received-identity', requestId: 'request-identity', name: 'Identity statement', party: 'Avery Stone', version: 1, pages: 1 },
  ],
}

export const DOCUMENT_CHECK_EXAMPLE: DocumentCheckInput = {
  requested: [
    { id: 'request-deed', name: 'Recorded deed', party: 'Avery Stone', periodStart: '2025-01-01', periodEnd: '2025-12-31', version: 2, pages: 2 },
    { id: 'request-lease', name: 'Lease agreement', party: 'Northwind Rentals', periodStart: '2025-01-01', periodEnd: '2025-12-31', version: 2, pages: 4 },
    { id: 'request-identity', name: 'Identity statement', party: 'Avery Stone', version: 1, pages: 1 },
  ],
  received: [
    { id: 'received-old-deed', requestId: 'request-deed', name: 'Recorded deed', party: 'Avery Stone', periodStart: '2024-01-01', periodEnd: '2024-12-31', version: 1, pages: 1 },
    { id: 'received-lease-1', requestId: 'request-lease', name: 'Lease agreement', party: 'Northwind Rentals', periodStart: '2025-01-01', periodEnd: '2025-12-31', version: 2, pages: 4 },
    { id: 'received-lease-2', requestId: 'request-lease', name: 'Lease agreement', party: 'Northwind Rentals', periodStart: '2025-01-01', periodEnd: '2025-12-31', version: 2, pages: 4 },
    { id: 'received-unassigned', requestId: null, name: 'Unassigned scan' },
  ],
}
