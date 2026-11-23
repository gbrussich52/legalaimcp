import { afterEach, beforeEach, expect, it, vi } from 'vitest'
vi.mock('@/lib/supabase-admin',()=>({getAdminClient:vi.fn()}))
vi.mock('@/lib/stripe',()=>({FEATURED_PRICE_CENTS:6900,getStripe:vi.fn(),isStripeConfigured:()=>true}))
import { getAdminClient } from '@/lib/supabase-admin'
import { getStripe } from '@/lib/stripe'
import { POST } from './route'

type Payment = {listing_id:string,status:string,created_at:string}
const payments = new Map<string,Payment>()
let listing: Record<string,unknown>
let failUpdate: boolean
let failLookup: boolean
let raceInsert: boolean
let session: Record<string,unknown>
let eventType: string
let updateCount: number
const orCalls:string[]=[]
// Claude Sonnet 5.5, 2026-11-23: row matches when any and(a,b) term has both atoms true for the current listing.
function atom(a:string):boolean {
  if(a==='featured_purchased_at.is.null') return listing.featured_purchased_at==null
  if(a.startsWith('featured_purchased_at.lte.')) return listing.featured_purchased_at!=null && Date.parse(String(listing.featured_purchased_at))<=Date.parse(a.slice('featured_purchased_at.lte.'.length))
  if(a==='featured.eq.false') return listing.featured===false
  if(a==='featured_until.not.is.null') return listing.featured_until!=null
  throw new Error('unknown atom '+a)
}
function matchesOr(expr:string):boolean {
  return expr.split(/,(?=and\()/).some(t=>{const m=/^and\((.*)\)$/.exec(t);if(!m) throw new Error('bad term '+t);return m[1].split(',').every(atom)})
}

function dbFrom(table:string) {
  let operation='select'; let payload:Record<string,unknown>={}; let field=''; let value=''; let orExpr:string|null=null;
  const execute = async () => {
    if(table==='listing_payments') {
      if(operation==='insert') {
        const id=String(payload.stripe_session_id)
        const record={listing_id:String(payload.listing_id),status:'completed',created_at:new Date().toISOString()}
        if(raceInsert) { payments.set(id,record); raceInsert=false; return {data:null,error:{code:'23505'}} }
        payments.set(id,record); return {data:record,error:null}
      }
      return {data:payments.get(value)??null,error:failLookup?{message:'lookup unavailable'}:null}
    }
    if(operation==='update') {
      updateCount++
      if(failUpdate) return {data:null,error:{message:'temporary failure'}}
      // Claude Sonnet 5.5, 2026-11-23: evaluate the single nested or=(and(..),and(..)) the way PostgREST would.
      if(orExpr!==null && !matchesOr(orExpr)) return {data:null,error:null}
      if(listing.featured_purchased_at && Date.parse(String(listing.featured_purchased_at))>Date.parse(String(payload.featured_purchased_at))) return {data:null,error:null}
      Object.assign(listing,payload); return {data:{id:value},error:null}
    }
    return {data:listing,error:null}
  }
  const builder={select:vi.fn(()=>builder),eq:vi.fn((f:string,v:string)=>{field=f;value=v;return builder}),or:vi.fn((filter:string)=>{expect(field).toBe('id');orCalls.push(filter);orExpr=filter;return builder}),insert:vi.fn((data:Record<string,unknown>)=>{operation='insert';payload=data;return builder}),update:vi.fn((data:Record<string,unknown>)=>{operation='update';payload=data;return builder}),single:execute,maybeSingle:execute}
  return builder
}
function request() {return new Request('https://example.com/api/stripe/webhook',{method:'POST',headers:{'stripe-signature':'synthetic'},body:'fixture'})}
beforeEach(()=>{
  vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-15T12:00:00Z'))
  vi.stubEnv('STRIPE_WEBHOOK_SECRET','synthetic-webhook-secret')
  vi.spyOn(console,'info').mockImplementation(()=>{});vi.spyOn(console,'error').mockImplementation(()=>{});vi.spyOn(console,'warn').mockImplementation(()=>{})
  orCalls.length=0;payments.clear();listing={featured:false,featured_purchased_at:null};failUpdate=false;failLookup=false;raceInsert=false;updateCount=0
  session={id:'cs_original',payment_status:'paid',metadata:{listing_id:'listing-one'},amount_total:6900,currency:'usd',payment_intent:'pi_fixture'}
  eventType='checkout.session.completed'
  vi.mocked(getAdminClient).mockReturnValue({from:dbFrom} as unknown as ReturnType<typeof getAdminClient>)
  vi.mocked(getStripe).mockReturnValue({webhooks:{constructEvent:()=>({type:eventType,data:{object:session}})}} as unknown as ReturnType<typeof getStripe>)
})
afterEach(()=>{vi.useRealTimers();vi.unstubAllEnvs();vi.restoreAllMocks()})

it('recovers failed listing fulfillment from existing ledger without shifting the paid term',async()=>{
  failUpdate=true;expect((await POST(request())).status).toBe(500);expect(payments.size).toBe(1);expect(listing.featured).toBe(false)
  failUpdate=false;vi.setSystemTime(new Date('2026-09-17T12:00:00Z'))
  expect((await POST(request())).status).toBe(200);expect(listing.featured).toBe(true)
  expect(listing.featured_purchased_at).toBe('2026-09-15T12:00:00.000Z');expect(listing.featured_until).toBe('2026-10-15T12:00:00.000Z')
})
it('duplicate successful completed/async events never extend the original term',async()=>{
  await POST(request());const original={...listing}
  eventType='checkout.session.async_payment_succeeded';vi.setSystemTime(new Date('2026-09-20T12:00:00Z'))
  expect((await POST(request())).status).toBe(200);expect(listing).toEqual(original);expect(payments.size).toBe(1)
})
it('a distinct purchase resets the term and an older replay cannot overwrite it',async()=>{
  await POST(request());vi.setSystemTime(new Date('2026-09-20T12:00:00Z'));session.id='cs_new'
  await POST(request());expect(listing.featured_until).toBe('2026-10-20T12:00:00.000Z');expect(payments.size).toBe(2)
  session.id='cs_original';expect((await POST(request())).status).toBe(200)
  expect(listing.stripe_checkout_session_id).toBe('cs_new');expect(listing.featured_until).toBe('2026-10-20T12:00:00.000Z')
})
it.each(['checkout.session.completed','checkout.session.async_payment_succeeded'])('never grants an unpaid %s event',async type=>{
  eventType=type;session.payment_status='unpaid'
  expect((await POST(request())).status).toBe(200);expect(payments.size).toBe(0);expect(updateCount).toBe(0)
})
it('concurrent ledger insert winner still reaches fulfillment',async()=>{
  raceInsert=true;expect((await POST(request())).status).toBe(200);expect(listing.featured).toBe(true);expect(payments.size).toBe(1)
})
it('payment evidence lookup failure asks Stripe to retry and never grants placement',async()=>{
  failLookup=true;expect((await POST(request())).status).toBe(500);expect(updateCount).toBe(0)
})


it('replaying an expired purchase after expiry cleanup cannot reactivate featured placement',async()=>{
  await POST(request());listing.featured=false
  vi.setSystemTime(new Date('2026-10-16T12:00:00Z'))
  const writesBefore=updateCount
  expect((await POST(request())).status).toBe(200)
  // Claude Sonnet 5.5, 2026-11-23: a term already over must not be written at all, or a plain row keeps a past end date.
  expect(updateCount).toBe(writesBefore)
  expect(listing.featured).toBe(false);expect(listing.featured_until).toBe('2026-10-15T12:00:00.000Z')
  session.id='cs_fresh';await POST(request());expect(listing.featured).toBe(true)
  session.id='cs_original';await POST(request());expect(listing.featured).toBe(true)
  expect(listing.stripe_checkout_session_id).toBe('cs_fresh')
})

// Claude Sonnet 5.5, 2026-11-23: an admin can make a row editorial after checkout started; the paid event must never convert it.
it('an editorial row at payment time is left alone, logged as PAID_NO_PLACEMENT, and answered 200',async()=>{
  listing={featured:true,featured_until:null,featured_purchased_at:null}
  const before={...listing}
  const res=await POST(request())
  expect(res.status).toBe(200)
  expect(listing).toEqual(before)
  expect(payments.get('cs_original')?.status).toBe('completed')
  const line=vi.mocked(console.error).mock.calls.map(c=>String(c[0])).find(m=>m.startsWith('PAID_NO_PLACEMENT'))
  expect(line).toContain('cs_original');expect(line).toContain('listing-one')
})
it('a replay of an editorial-blocked payment stays 200 and leaves the row alone',async()=>{
  listing={featured:true,featured_until:null,featured_purchased_at:null}
  await POST(request());expect((await POST(request())).status).toBe(200);expect(listing.featured_until).toBeNull()
})

// Claude Sonnet 5.5, 2026-11-23: PostgREST's own tests prove nesting inside ONE or= parameter, not two same-key or= parameters.
it('sends the listing update with exactly one or() holding the four and() terms',async()=>{
  await POST(request())
  expect(orCalls).toHaveLength(1)
  const at='2026-09-15T12:00:00.000Z'
  expect(orCalls[0].split(/,(?=and\()/).sort()).toEqual([
    `and(featured_purchased_at.is.null,featured.eq.false)`,
    `and(featured_purchased_at.is.null,featured_until.not.is.null)`,
    `and(featured_purchased_at.lte.${at},featured.eq.false)`,
    `and(featured_purchased_at.lte.${at},featured_until.not.is.null)`,
  ].sort())
})
