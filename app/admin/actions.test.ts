import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/headers', () => ({ headers: vi.fn() }))
vi.mock('@/lib/admin-auth', () => ({ isAdminAuthenticated: vi.fn() }))
vi.mock('@/lib/supabase-admin', () => ({ getAdminClient: vi.fn() }))

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getAdminClient } from '@/lib/supabase-admin'
import { updateListingStatus, deleteListing, approveSubmission } from './actions'

type AnyRecord = Record<string, unknown>

function mockHeaders(record: Record<string, string>) {
  vi.mocked(headers).mockResolvedValue(
    new Headers(record) as unknown as Awaited<ReturnType<typeof headers>>,
  )
}

const SAME_ORIGIN = {
  host: 'legalaimcp.com',
  origin: 'https://legalaimcp.com',
  'sec-fetch-site': 'same-origin',
}

/**
 * Chainable fake of the supabase admin client covering the call shapes used
 * by app/admin/actions.ts. Captures insert/update payloads for assertions.
 */
function makeDb(opts: { submission?: AnyRecord | null; slugTaken?: boolean; insertError?: { message: string } | null } = {}) {
  const inserted: AnyRecord[] = []
  const updated: Array<{ table: string; payload: AnyRecord }> = []

  const db = {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: async () =>
            table === 'submissions'
              ? { data: opts.submission ?? null, error: opts.submission ? null : { message: 'not found' } }
              : { data: null, error: null },
          maybeSingle: async () => ({ data: opts.slugTaken ? { slug: 'taken' } : null, error: null }),
        })),
      })),
      insert: vi.fn(async (payload: AnyRecord) => {
        inserted.push(payload)
        return { error: opts.insertError ?? null }
      }),
      update: vi.fn((payload: AnyRecord) => {
        updated.push({ table, payload })
        return { eq: async () => ({ error: null }) }
      }),
      delete: vi.fn(() => ({ eq: async () => ({ error: null }) })),
    })),
  }
  vi.mocked(getAdminClient).mockReturnValue(db as unknown as ReturnType<typeof getAdminClient>)
  return { db, inserted, updated }
}

const VALID_LISTING_DATA = {
  name: 'Cool Legal Tool',
  tagline: 'An AI tool that does legal things fast.',
  category: 'legal_research',
  external_url: 'https://example.com',
  pricing_model: 'paid',
  description: 'A serious description of the tool that is definitely longer than fifty characters.',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockHeaders(SAME_ORIGIN)
  vi.mocked(isAdminAuthenticated).mockResolvedValue(true)
})

describe('requireAdmin (via exported actions)', () => {
  it('rejects when there is no valid admin session', async () => {
    vi.mocked(isAdminAuthenticated).mockResolvedValue(false)
    makeDb()
    await expect(updateListingStatus('id-1', 'published')).rejects.toThrow('Unauthorized')
  })

  it('never touches the DB client when unauthenticated', async () => {
    vi.mocked(isAdminAuthenticated).mockResolvedValue(false)
    makeDb()
    await expect(deleteListing('id-1')).rejects.toThrow('Unauthorized')
    expect(getAdminClient).not.toHaveBeenCalled()
  })

  it('rejects cross-origin requests even with a valid session (CSRF)', async () => {
    mockHeaders({ host: 'legalaimcp.com', origin: 'https://evil.com' })
    makeDb()
    await expect(deleteListing('id-1')).rejects.toThrow('Unauthorized')
    expect(getAdminClient).not.toHaveBeenCalled()
  })

  it('rejects sec-fetch-site: cross-site requests (CSRF)', async () => {
    mockHeaders({ host: 'legalaimcp.com', 'sec-fetch-site': 'cross-site' })
    makeDb()
    await expect(updateListingStatus('id-1', 'published')).rejects.toThrow('Unauthorized')
  })
})

describe('updateListingStatus', () => {
  it('updates with a valid status and revalidates', async () => {
    const { updated } = makeDb()
    await updateListingStatus('id-1', 'rejected')
    expect(updated).toEqual([{ table: 'listings', payload: { status: 'rejected' } }])
    expect(revalidatePath).toHaveBeenCalledWith('/servers')
    expect(revalidatePath).toHaveBeenCalledWith('/servers/[slug]', 'page')
    expect(revalidatePath).toHaveBeenCalledWith('/categories/[slug]', 'page')
  })

  it('rejects an invalid enum value before any DB write', async () => {
    const { updated } = makeDb()
    await expect(
      updateListingStatus('id-1', 'archived' as never),
    ).rejects.toThrow('Invalid status')
    expect(updated).toHaveLength(0)
  })

  it('rejects injection-shaped status values', async () => {
    const { updated } = makeDb()
    await expect(
      updateListingStatus('id-1', "published'; DROP TABLE listings;--" as never),
    ).rejects.toThrow('Invalid status')
    expect(updated).toHaveLength(0)
  })
})

describe('approveSubmission', () => {
  it('throws when the submission does not exist', async () => {
    makeDb({ submission: null })
    await expect(approveSubmission('missing-id')).rejects.toThrow('Submission not found')
  })

  it('throws when listing_data has no name', async () => {
    makeDb({ submission: { id: 's1', listing_data: { tagline: 'no name here at all' }, submitter_name: 'X', status: 'pending' } })
    await expect(approveSubmission('s1')).rejects.toThrow('Submission has no tool name')
  })

  it('publishes a valid submission with schema-validated values', async () => {
    const { inserted, updated } = makeDb({
      submission: { id: 's1', listing_data: VALID_LISTING_DATA, submitter_name: 'Jane', status: 'pending' },
    })
    await approveSubmission('s1')

    expect(inserted).toHaveLength(1)
    expect(inserted[0]).toMatchObject({
      name: 'Cool Legal Tool',
      slug: 'cool-legal-tool',
      category: 'legal_research',
      pricing_model: 'paid',
      status: 'published',
      source: 'submitted',
      creator_name: 'Jane',
    })
    // submission marked approved
    expect(updated).toContainEqual({ table: 'submissions', payload: { status: 'approved' } })
  })

  it('strips XSS payloads from the generated slug', async () => {
    const { inserted } = makeDb({
      submission: {
        id: 's1',
        listing_data: { ...VALID_LISTING_DATA, name: '<script>alert(1)</script> Legal "Tool"' },
        submitter_name: 'Mallory',
        status: 'pending',
      },
    })
    await approveSubmission('s1')
    expect(inserted[0].slug).toMatch(/^[a-z0-9-]+$/)
    expect(String(inserted[0].slug)).not.toContain('<')
  })

  it('suffixes the slug on collision', async () => {
    const { inserted } = makeDb({
      submission: { id: 's1', listing_data: VALID_LISTING_DATA, submitter_name: 'Jane', status: 'pending' },
      slugTaken: true,
    })
    await approveSubmission('s1')
    const slug = String(inserted[0].slug)
    expect(slug).not.toBe('cool-legal-tool')
    expect(slug.startsWith('cool-legal-tool-')).toBe(true)
  })

  it('coerces an invalid category enum to general instead of inserting it', async () => {
    const { inserted } = makeDb({
      submission: {
        id: 's1',
        listing_data: { ...VALID_LISTING_DATA, category: 'totally_fake_category' },
        submitter_name: 'Mallory',
        status: 'pending',
      },
    })
    await approveSubmission('s1')
    expect(inserted[0].category).toBe('general')
  })

  it('coerces an invalid pricing_model enum to free instead of inserting it', async () => {
    const { inserted } = makeDb({
      submission: {
        id: 's1',
        listing_data: { ...VALID_LISTING_DATA, pricing_model: "free'; DROP TABLE listings;--" },
        submitter_name: 'Mallory',
        status: 'pending',
      },
    })
    await approveSubmission('s1')
    expect(inserted[0].pricing_model).toBe('free')
  })

  it('never publishes javascript:/data: URLs, even on the re-validation fallback path', async () => {
    const { inserted } = makeDb({
      submission: {
        id: 's1',
        listing_data: {
          ...VALID_LISTING_DATA,
          external_url: 'javascript:alert(1)',
          creator_url: 'data:text/html,<script>alert(1)</script>',
          mcp_repo_url: 'vbscript:msgbox(1)',
        },
        submitter_name: 'Mallory',
        status: 'pending',
      },
    })
    await approveSubmission('s1')
    expect(inserted[0].external_url).toBeNull()
    expect(inserted[0].creator_url).toBeNull()
    expect(inserted[0].mcp_repo_url).toBeNull()
  })

  it('surfaces DB insert failures', async () => {
    makeDb({
      submission: { id: 's1', listing_data: VALID_LISTING_DATA, submitter_name: 'Jane', status: 'pending' },
      insertError: { message: 'duplicate key' },
    })
    await expect(approveSubmission('s1')).rejects.toThrow('Failed to create listing: duplicate key')
  })
})
