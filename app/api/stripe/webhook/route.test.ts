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

function dbFrom(table:string) {
  let operation='select'; let payload:Record<string,unknown>={}; let field=''; let value='';
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
      if(listing.featured_purchased_at && Date.parse(String(listing.featured_purchased_at))>Date.parse(String(payload.featured_purchased_at))) return {data:null,error:null}
      Object.assign(listing,payload); return {data:{id:value},error:null}
    }
    return {data:listing,error:null}
  }
  const builder={select:vi.fn(()=>builder),eq:vi.fn((f:string,v:string)=>{field=f;value=v;return builder}),or:vi.fn((filter:string)=>{expect(field).toBe('id');expect(filter).toBe(`featured_purchased_at.is.null,featured_purchased_at.lte.${payload.featured_purchased_at}`);return builder}),insert:vi.fn((data:Record<string,unknown>)=>{operation='insert';payload=data;return builder}),update:vi.fn((data:Record<string,unknown>)=>{operation='update';payload=data;return builder}),single:execute,maybeSingle:execute}
  return builder
}
function request() {return new Request('https://example.com/api/stripe/webhook',{method:'POST',headers:{'stripe-signature':'synthetic'},body:'fixture'})}
beforeEach(()=>{
  vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-15T12:00:00Z'))
  vi.stubEnv('STRIPE_WEBHOOK_SECRET','synthetic-webhook-secret')
  vi.spyOn(console,'info').mockImplementation(()=>{});vi.spyOn(console,'error').mockImplementation(()=>{});vi.spyOn(console,'warn').mockImplementation(()=>{})
  payments.clear();listing={featured:false,featured_purchased_at:null};failUpdate=false;failLookup=false;raceInsert=false;updateCount=0
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
  expect((await POST(request())).status).toBe(200)
  expect(listing.featured).toBe(false);expect(listing.featured_until).toBe('2026-10-15T12:00:00.000Z')
  session.id='cs_fresh';await POST(request());expect(listing.featured).toBe(true)
  session.id='cs_original';await POST(request());expect(listing.featured).toBe(true)
  expect(listing.stripe_checkout_session_id).toBe('cs_fresh')
})
