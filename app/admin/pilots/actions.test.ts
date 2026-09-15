// classification: PUBLIC
import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ auth: vi.fn(), origin: vi.fn(), client: vi.fn(), update: vi.fn(), eq: vi.fn(), select: vi.fn(), result: vi.fn() }))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: (path: string) => { throw new Error(path) } }))
vi.mock('@/lib/admin-auth', () => ({ isAdminAuthenticated: mocks.auth }))
vi.mock('@/lib/origin', () => ({ isSameOriginRequest: mocks.origin }))
vi.mock('@/lib/supabase-admin', () => ({ getAdminClient: mocks.client }))
import { updatePilot } from './actions'
function form(status = 'reviewing', support = '') { const f = new FormData(); f.set('id', '123e4567-e89b-42d3-a456-426614174000'); f.set('status', status); f.set('supportMinutes', support); return f }
beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue(true); mocks.origin.mockReturnValue(true); mocks.client.mockReturnValue({ from: () => ({ update: mocks.update }) }); mocks.update.mockReturnValue({ eq: mocks.eq }); mocks.eq.mockReturnValue({ select: mocks.select }); mocks.select.mockReturnValue({ maybeSingle: mocks.result }); mocks.result.mockResolvedValue({ data: { id: 'saved' }, error: null }) })
describe('private pilot review', () => {
  it('checks authorization before accessing the database', async () => {
    mocks.auth.mockResolvedValue(false)
    await expect(updatePilot(form())).rejects.toThrow('Unauthorized')
    expect(mocks.client).not.toHaveBeenCalled()
  })
  it('rejects cross-origin updates before database access', async () => {
    mocks.origin.mockReturnValue(false)
    await expect(updatePilot(form())).rejects.toThrow('Unauthorized')
    expect(mocks.client).not.toHaveBeenCalled()
  })
  it('rejects fabricated paid state', async () => {
    await expect(updatePilot(form('paid'))).rejects.toThrow('result=invalid')
    expect(mocks.client).not.toHaveBeenCalled()
  })
  it('keeps unrecorded effort unknown', async () => {
    await expect(updatePilot(form())).rejects.toThrow('result=saved')
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ support_minutes: null, status: 'reviewing' }))
  })
  it('does not claim success when a row was not updated', async () => {
    mocks.result.mockResolvedValue({ data: null, error: null })
    await expect(updatePilot(form())).rejects.toThrow('result=unavailable')
  })
})
