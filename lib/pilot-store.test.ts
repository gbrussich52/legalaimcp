// classification: PUBLIC
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PilotInput } from './pilot-intake'
import { PILOT_CONSENT_VERSION } from './pilot-intake'

vi.mock('@/lib/supabase', () => ({ createSchemaClient: vi.fn() }))
import { createSchemaClient } from './supabase'
import { pilotSourceKey, submitPilotRequest } from './pilot-store'

const id = 'dd6fbbef-28e4-40b6-b327-64279344959e'
const hash = 'a'.repeat(64)
const input: PilotInput = {requestId:id,name:' Example ',email:' Applicant@Example.com ',organization:' Example Agency ',workflow:' Verify a synthetic catalog. ',endpoint:'',access:'public',readOnly:'yes',sampleInput:' Fictional request ',expectedResult:' One fictional item ',failureExample:' Empty item list ',pricingInterest:'yes',consent:true,synthetic:true,source:'pilot'}
const abortSignal = vi.fn()
const rpc = vi.fn()

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('NODE_ENV','production'); vi.stubEnv('VERCEL','1')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://database.example.com')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','synthetic-unit-test-key')
  abortSignal.mockResolvedValue({data:{status:'saved',id},error:null})
  rpc.mockReturnValue({abortSignal})
  vi.mocked(createSchemaClient).mockReturnValue({rpc} as unknown as ReturnType<typeof createSchemaClient>)
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs() })

describe('daily source identity', () => {
  it('rejects missing, invalid and untrusted production source information', () => {
    for (const values of [{},{'x-forwarded-for':'203.0.113.1'},{'x-vercel-forwarded-for':'garbage'},{'x-vercel-forwarded-for':'203.0.113.1:8080'}] as Record<string,string>[]) {
      expect(pilotSourceKey(new Headers(values))).toBeNull()
    }
    vi.stubEnv('VERCEL','0')
    expect(pilotSourceKey(new Headers({'x-vercel-forwarded-for':'203.0.113.1'}))).toBeNull()
    vi.stubEnv('VERCEL','1'); vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','')
    expect(pilotSourceKey(new Headers({'x-vercel-forwarded-for':'203.0.113.1'}))).toBeNull()
  })
  it('is stable within a UTC day, rotates at midnight, and never returns raw addresses', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-14T00:01:00Z'))
    const headers = new Headers({'x-vercel-forwarded-for':'203.0.113.1'})
    const first = pilotSourceKey(headers)
    expect(first).toMatch(/^[a-f0-9]{64}$/); expect(first).not.toContain('203.0.113.1')
    vi.setSystemTime(new Date('2026-09-14T23:59:59Z'))
    expect(pilotSourceKey(headers)).toBe(first)
    expect(pilotSourceKey(new Headers({'x-vercel-forwarded-for':'203.0.113.2'}))).not.toBe(first)
    vi.setSystemTime(new Date('2026-09-15T00:00:00Z'))
    expect(pilotSourceKey(headers)).not.toBe(first)
    const second = pilotSourceKey(headers)
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','different-synthetic-unit-test-key')
    expect(pilotSourceKey(headers)).not.toBe(second)
  })
  it('uses one fixed development source regardless of spoofed headers', () => {
    vi.stubEnv('NODE_ENV','development'); vi.stubEnv('VERCEL','0')
    expect(pilotSourceKey(new Headers())).toBe(pilotSourceKey(new Headers({'x-vercel-forwarded-for':'203.0.113.1'})))
  })
})

describe('private pilot persistence', () => {
  it('submits only the normalized server-built payload and hash, and returns confirmed receipt', async () => {
    const forged = {...input,status:'closed',support_minutes:999,qualification:'forged',rawIp:'203.0.113.1'}
    expect(await submitPilotRequest(forged,'standard',hash)).toEqual({status:'saved',id})
    expect(createSchemaClient).toHaveBeenCalledWith('https://database.example.com','synthetic-unit-test-key',{auth:{persistSession:false,autoRefreshToken:false}})
    expect(rpc).toHaveBeenCalledExactlyOnceWith('submit_pilot_request',{
      p_request_id:id,p_qualification:'standard',p_source_hash:hash,
      p_payload:{name:'Example',email:'applicant@example.com',organization:'Example Agency',workflow:'Verify a synthetic catalog.',endpoint:'',access:'public',readOnly:'yes',sampleInput:'Fictional request',expectedResult:'One fictional item',failureExample:'Empty item list',pricingInterest:'yes',source:'pilot',consent:{contact:true,synthetic:true,version:PILOT_CONSENT_VERSION}},
    })
    expect(abortSignal).toHaveBeenCalledWith(expect.any(AbortSignal))
    expect(JSON.stringify(rpc.mock.calls)).not.toMatch(/rawIp|203\.0\.113|support_minutes|forged/)
  })
  it.each(['', 'not-a-hash', 'a'.repeat(63), 'G'.repeat(64)])('rejects invalid hash before opening a database client',async invalidHash => {
    expect(await submitPilotRequest(input,'standard',invalidHash)).toEqual({status:'unavailable'})
    expect(createSchemaClient).not.toHaveBeenCalled()
  })
  it.each(['NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'])('fails closed when %s is unavailable',async key => {
    vi.stubEnv(key,'')
    expect(await submitPilotRequest(input,'standard',hash)).toEqual({status:'unavailable'})
    expect(createSchemaClient).not.toHaveBeenCalled()
  })
  it.each([{status:'saved',id:'different-receipt'},null,{status:'unexpected'},{status:'saved'}])('does not issue an unconfirmed or mismatched receipt',async data => {
    abortSignal.mockResolvedValue({data,error:null})
    expect(await submitPilotRequest(input,'standard',hash)).toEqual({status:'unavailable'})
  })
  it.each(['rate_limited','conflict'] as const)('propagates %s without exposing extra database data',async status => {
    abortSignal.mockResolvedValue({data:{status,id:'private'},error:null})
    expect(await submitPilotRequest(input,'needs_scope',hash)).toEqual({status})
  })
  it('redacts database errors and exceptions, including client creation failures',async () => {
    abortSignal.mockResolvedValue({data:{status:'saved',id},error:{message:'sensitive database details'}})
    expect(await submitPilotRequest(input,'standard',hash)).toEqual({status:'unavailable'})
    abortSignal.mockRejectedValue(new Error('sensitive transport details'))
    expect(await submitPilotRequest(input,'standard',hash)).toEqual({status:'unavailable'})
    vi.mocked(createSchemaClient).mockImplementation(() => {throw new Error('sensitive client details')})
    expect(await submitPilotRequest(input,'standard',hash)).toEqual({status:'unavailable'})
  })
})
