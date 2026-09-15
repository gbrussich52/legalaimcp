// classification: PUBLIC
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/headers', () => ({ headers: vi.fn() }))
vi.mock('@/lib/origin', () => ({ isSameOriginRequest: vi.fn() }))
vi.mock('@/lib/pilot-store', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/pilot-store')>(), submitPilotRequest: vi.fn() }))

import { headers } from 'next/headers'
import { isSameOriginRequest } from '@/lib/origin'
import { pilotSourceKey, submitPilotRequest } from '@/lib/pilot-store'
import { submitPilot } from './actions'

const requestId = 'dd6fbbef-28e4-40b6-b327-64279344959e'
const previous = { success: false, error: null }
function form() {
  const data = new FormData()
  for (const [key,value] of Object.entries({requestId,name:'Example Applicant',email:'applicant@example.com',organization:'Example Agency',workflow:'Verify our synthetic daily catalog output before client delivery.',endpoint:'https://example.com/mcp',access:'public',readOnly:'yes',sampleInput:'Synthetic catalog request for a fictional account with no personal data.',expectedResult:'At least one synthetic catalog item and an update timestamp less than one day old.',failureExample:'The endpoint returns an empty list although the synthetic catalog should contain one item.',pricingInterest:'yes',consent:'on',synthetic:'on',source:'pilot'})) data.set(key,value)
  return data
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('NODE_ENV','test')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','synthetic-test-key')
  vi.mocked(headers).mockResolvedValue(new Headers() as Awaited<ReturnType<typeof headers>>)
  vi.mocked(isSameOriginRequest).mockReturnValue(true)
  vi.mocked(submitPilotRequest).mockResolvedValue({status:'saved',id:requestId})
})

afterEach(() => vi.unstubAllEnvs())

describe('private pilot submission', () => {
  it('returns receipt only after durable storage confirms success; strips forged fields',async () => {
    const data=form(); data.set('status','closed'); data.set('qualification','forged'); data.set('support_minutes','100'); data.set('receipt','forged')
    const result=await submitPilot(previous,data)
    expect(result).toEqual({success:true,error:null,receipt:requestId,qualification:'standard'})
    const [stored,qualification]=vi.mocked(submitPilotRequest).mock.calls[0]
    expect(stored).not.toHaveProperty('status'); expect(stored).not.toHaveProperty('qualification'); expect(stored).not.toHaveProperty('support_minutes'); expect(stored).not.toHaveProperty('receipt')
    expect(qualification).toBe('standard')
  })
  it.each(['consent','synthetic'])('requires %s consent before persistence',async field => {
    const data=form(); data.delete(field)
    expect((await submitPilot(previous,data)).success).toBe(false)
    expect(submitPilotRequest).not.toHaveBeenCalled()
  })
  it('rejects cross-origin submissions and filled honeypots',async () => {
    vi.mocked(isSameOriginRequest).mockReturnValue(false)
    expect((await submitPilot(previous,form())).success).toBe(false)
    vi.mocked(isSameOriginRequest).mockReturnValue(true)
    const data=form(); data.set('website','https://spam.example')
    expect((await submitPilot(previous,data)).success).toBe(false)
    expect(submitPilotRequest).not.toHaveBeenCalled()
  })
  it.each(['unavailable','rate_limited','conflict'] as const)('withholds receipt on %s result',async status => {
    vi.mocked(submitPilotRequest).mockResolvedValue({status})
    const result=await submitPilot({success:true,error:null,receipt:'stale'},form())
    expect(result.success).toBe(false); expect(result).not.toHaveProperty('receipt'); expect(result.error).toBeTruthy()
  })
  it('hides storage exceptions and rejects invalid request IDs before storage',async () => {
    vi.mocked(submitPilotRequest).mockRejectedValue(new Error('database password sensitive'))
    const result=await submitPilot(previous,form())
    expect(result.success).toBe(false); expect(JSON.stringify(result)).not.toMatch(/password|sensitive/)
    vi.mocked(submitPilotRequest).mockClear()
    const data=form(); data.set('requestId','not-a-uuid')
    expect((await submitPilot(previous,data)).success).toBe(false); expect(submitPilotRequest).not.toHaveBeenCalled()
  })
  it('qualifies authenticated or non-read-only workflows for manual scoping',async () => {
    const data=form(); data.set('access','authenticated'); data.set('readOnly','unsure')
    const result=await submitPilot(previous,data)
    expect(result.qualification).toBe('needs_scope')
    expect(vi.mocked(submitPilotRequest).mock.calls[0][1]).toBe('needs_scope')
  })
})


describe('private daily source quota identity', () => {
  it('ignores spoofed development headers and uses a fixed hashed local source', async () => {
    const empty = pilotSourceKey(new Headers())
    const spoofed = pilotSourceKey(new Headers({'x-vercel-forwarded-for':'203.0.113.12','x-forwarded-for':'198.51.100.3'}))
    expect(empty).toMatch(/^[a-f0-9]{64}$/); expect(spoofed).toBe(empty)
    await submitPilot(previous,form())
    expect(vi.mocked(submitPilotRequest).mock.calls[0][2]).toBe(empty)
  })
  it('fails closed in production without Vercel trusted source before persistence',async () => {
    vi.stubEnv('NODE_ENV','production'); vi.stubEnv('VERCEL','0')
    expect((await submitPilot(previous,form())).success).toBe(false)
    vi.stubEnv('VERCEL','1')
    expect((await submitPilot(previous,form())).success).toBe(false)
    vi.mocked(headers).mockResolvedValue(new Headers({'x-vercel-forwarded-for':'not-an-ip','x-forwarded-for':'203.0.113.1'}) as Awaited<ReturnType<typeof headers>>)
    expect((await submitPilot(previous,form())).success).toBe(false)
    expect(submitPilotRequest).not.toHaveBeenCalled()
  })
  it('accepts a trusted Vercel address and hashes it without retaining the raw address',async () => {
    vi.stubEnv('NODE_ENV','production'); vi.stubEnv('VERCEL','1')
    vi.mocked(headers).mockResolvedValue(new Headers({'x-vercel-forwarded-for':'203.0.113.1, 203.0.113.2'}) as Awaited<ReturnType<typeof headers>>)
    expect((await submitPilot(previous,form())).success).toBe(true)
    const hash=vi.mocked(submitPilotRequest).mock.calls[0][2]
    expect(hash).toMatch(/^[a-f0-9]{64}$/); expect(hash).not.toContain('203.0.113')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','')
    expect(pilotSourceKey(new Headers({'x-vercel-forwarded-for':'203.0.113.1'}))).toBeNull()
  })
})
