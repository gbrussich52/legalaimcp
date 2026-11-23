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
  // Claude Sonnet 5.5, 2026-11-23: atoms of the "no active term bought by a different payment" guard.
  if(a==='featured_until.is.null') return listing.featured_until==null
  if(a.startsWith('featured_until.lte.')) return listing.featured_until!=null && Date.parse(String(listing.featured_until))<=Date.parse(a.slice('featured_until.lte.'.length))
  if(a.startsWith('featured_purchased_at.eq.')) return listing.featured_purchased_at!=null && Date.parse(String(listing.featured_purchased_at))===Date.parse(a.slice('featured_purchased_at.eq.'.length))
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
it('a distinct purchase after the term ended resets the term and an older replay cannot overwrite it',async()=>{
  // Claude Sonnet 5.5, 2026-11-23: was 2026-09-20, inside the first term. A second payment inside an active term no longer restarts it (see the active-term tests below).
  await POST(request());vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));session.id='cs_new'
  await POST(request());expect(listing.featured_until).toBe('2026-11-19T12:00:00.000Z');expect(payments.size).toBe(2)
  session.id='cs_original';expect((await POST(request())).status).toBe(200)
  expect(listing.stripe_checkout_session_id).toBe('cs_new');expect(listing.featured_until).toBe('2026-11-19T12:00:00.000Z')
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

// Claude Sonnet 5.5, 2026-11-23: two tabs, two paid sessions for one listing. The second payment must not change the row.
const noPlacementLines=()=>vi.mocked(console.error).mock.calls.map(c=>String(c[0])).filter(m=>m.startsWith('PAID_NO_PLACEMENT'))
it('order A then B: a second payment inside an active term leaves the row alone and logs active_term once',async()=>{
  session.id='cs_A';await POST(request());const afterA={...listing}
  vi.setSystemTime(new Date('2026-09-16T12:00:00Z'));session.id='cs_B'
  expect((await POST(request())).status).toBe(200)
  expect(listing).toEqual(afterA);expect(payments.size).toBe(2)
  expect(noPlacementLines()).toEqual(['PAID_NO_PLACEMENT session=cs_B listing=listing-one reason=active_term'])
})
it('order B then A (B ledger is older, A is applied first): the older payment is logged, row unchanged',async()=>{
  payments.set('cs_B',{listing_id:'listing-one',status:'completed',created_at:'2026-09-15T12:00:00.000Z'})
  vi.setSystemTime(new Date('2026-09-16T12:00:00Z'));session.id='cs_A';await POST(request());const afterA={...listing}
  session.id='cs_B'
  expect((await POST(request())).status).toBe(200)
  expect(listing).toEqual(afterA)
  expect(noPlacementLines()).toEqual(['PAID_NO_PLACEMENT session=cs_B listing=listing-one reason=active_term'])
})
it('redelivery of the payment that holds the term is idempotent and silent',async()=>{
  session.id='cs_A';await POST(request());const afterA={...listing}
  vi.setSystemTime(new Date('2026-09-16T12:00:00Z'))
  expect((await POST(request())).status).toBe(200)
  expect(listing).toEqual(afterA);expect(noPlacementLines()).toEqual([])
})
it('a purchase after the term ended places the listing, also when the cron has not cleared featured',async()=>{
  listing={featured:true,featured_until:'2026-09-10T12:00:00.000Z',featured_purchased_at:'2026-08-11T12:00:00.000Z',stripe_checkout_session_id:'cs_old'}
  expect((await POST(request())).status).toBe(200)
  expect(listing.stripe_checkout_session_id).toBe("cs_original")
  expect(listing.featured_until).toBe('2026-10-15T12:00:00.000Z');expect(noPlacementLines()).toEqual([])
})

// Claude Sonnet 5.5, 2026-11-23: PostgREST's own tests prove nesting inside ONE or= parameter, not two same-key or= parameters.
it('sends the listing update with exactly one or() holding the twelve and() terms',async()=>{
  await POST(request())
  expect(orCalls).toHaveLength(1)
  const at='2026-09-15T12:00:00.000Z'
  const now='2026-09-15T12:00:00.000Z'
  // not newer x not editorial x (no term, term over, or this very payment holds it)
  const a=['featured_purchased_at.is.null',`featured_purchased_at.lte.${at}`]
  const b=['featured.eq.false','featured_until.not.is.null']
  const c=['featured_until.is.null',`featured_until.lte.${now}`,`featured_purchased_at.eq.${at}`]
  const want=a.flatMap(x=>b.flatMap(y=>c.map(z=>`and(${x},${y},${z})`)))
  expect(want).toHaveLength(12)
  expect(orCalls[0].split(/,(?=and\()/).sort()).toEqual(want.sort())
})
