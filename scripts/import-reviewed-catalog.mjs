// PUBLIC. Explicit operator command, not a scheduler. Primary evidence is data, never code.
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { compileFunction } from 'node:vm'
import { randomBytes } from 'node:crypto'
import ts from 'typescript'
import { createClient } from '@supabase/supabase-js'
const ROOT = resolve(import.meta.dirname, '..')
const PROJECT = 'bzrdzchrdthyrhdsodla'

// Reuse the app's actual gate and trusted registry; no copied validation or new dependency.
export async function loadCatalogGate() {
  const file=resolve(ROOT,'lib/catalog-review.ts')
  const {outputText}=ts.transpileModule(await readFile(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}})
  const module={exports:{}}
  // Compile only our trusted checked-in gate, never source pages or model output.
  compileFunction(outputText,['require','module','exports'],{filename:file})(createRequire(file),module,module.exports)
  return module.exports
}

/** Existing weekly maintenance calls this same deterministic gate; no auto-rewrites.
 * @param {any} db
 * @param {{output?:string|false,gate?:any,fetcher?:typeof fetch}} options
 */
export async function auditPublishedCatalog(db, { output = resolve(ROOT,'scripts/weekly/logs/catalog-health.json'), gate, fetcher = fetch } = {}) {
  const save = async report => {
    if (!output) return
    await mkdir(resolve(output,'..'),{recursive:true})
    const temp=`${output}.${process.pid}.tmp`;await writeFile(temp,JSON.stringify(report,null,2)+'\n');await rename(temp,output)
  }
  await save({checkedAt:new Date().toISOString(),ok:false,errorCode:'IN_PROGRESS'})
  gate ??= await loadCatalogGate()
  const {data:rows,error}=await db.from('listings').select(['id',...gate.CATALOG_CLAIM_FIELDS].join(',')).eq('status','published')
  if(error||!Array.isArray(rows)||!rows.length||rows.length>100){await save({checkedAt:new Date().toISOString(),ok:false,errorCode:'CATALOG_READ_FAILED'});throw Error('Published catalog read incomplete')}
  const cache=new Map(), findings=[];let bytes=0,index=0
  const deadline=AbortSignal.timeout(180000)
  const cachedFetch=async (url,options={})=>{
    const key=String(url)
    if(!cache.has(key)){
      if(cache.size>=100)throw Error('Primary-source request budget exceeded')
      cache.set(key,(async()=>{
        const response=await fetcher(url,{...options,signal:options.signal?AbortSignal.any([options.signal,deadline]):deadline})
        const reader=response.body?.getReader();let size=0;const chunks=[]
        if(reader)try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;bytes+=value.byteLength;if(size>2_000_000||bytes>64_000_000)throw Error('Primary-source byte budget exceeded');chunks.push(Buffer.from(value))}}finally{await reader.cancel()}
        return {status:response.status,body:Buffer.concat(chunks)}
      })())
    }
    const source=await cache.get(key)
    return new Response([204,304].includes(source.status)?null:source.body,{status:source.status})
  }
  await Promise.all(Array.from({length:Math.min(4,rows.length)},async()=>{
    for(;;){const row=rows[index++];if(!row)return;try{await gate.assertCatalogReview(row,{fetcher:cachedFetch})}catch(e){findings.push({slug:row.slug,reason:String(e.message).slice(0,200)})}}
  }))
  const report={checkedAt:new Date().toISOString(),ok:findings.length===0,checked:rows.length,sourceRequests:cache.size,findings:findings.sort((a,b)=>a.slug.localeCompare(b.slug)),errorCode:findings.length?'SOURCE_REVIEW_REQUIRED':null}
  await save(report)
  if(findings.length&&output){const file=resolve(output,'..','catalog-improve.md');await writeFile(file,'# Source review required\n\n'+findings.map(f=>`- ${f.slug}: ${f.reason}`).join('\n')+'\n\nDo not rewrite claims, approve an entry or refresh review dates automatically. Inspect primary evidence and use the reviewed import path.\n')}
  return report
}

export async function validateImport(plan, gate, { checkSources = true } = {}) {
  if (!Array.isArray(plan) || !plan.length || plan.length > 100) throw Error('Expected 1–100 reviewed corrections')
  const ids = new Set(), slugs = new Set()
  const records = JSON.parse(await readFile(resolve(ROOT,'lib/catalog-reviews.json'),'utf8'))
  const checked = []
  for (const item of plan) {
    if (!/^[a-f0-9-]{36}$/.test(item.id) || ids.has(item.id) || !/^[a-z0-9-]+$/.test(item.listing?.slug) || slugs.has(item.listing.slug)) throw Error('Invalid or duplicate correction identity')
    ids.add(item.id); slugs.add(item.listing.slug)
    if (!item.expected_claims || item.expected_claims.slug !== item.listing.slug || !['published','pending_review','rejected'].includes(item.listing.status) || !['published','pending_review','rejected'].includes(item.expected_status)) throw Error('Correction must bind the existing slug, before-status and before-claims, and cannot delete rows')
    const claims = gate.catalogClaims(item.listing)
    let review = null
    if (item.listing.status === 'published') {
      review = records.reviews.find(r => r.slug === item.listing.slug && r.decision === 'approved' && r.listing_sha256 === gate.catalogFingerprint(claims))
      if (!review) throw Error(`No trusted exact-claim approval for ${item.listing.slug}`)
      if (checkSources) await gate.assertCatalogReview(claims)
    } else if (!records.blocked_slugs.includes(item.listing.slug)) throw Error(`Quarantine requires a recorded editorial decision: ${item.listing.slug}`)
    checked.push({ id:item.id, expected_status:item.expected_status, expected_claims:gate.catalogClaims(item.expected_claims), listing:{...claims,status:item.listing.status}, review })
  }
  return checked
}

export function importSQL(checked, { rollback = false } = {}) {
  const data = JSON.stringify(checked)
  let tag; do {tag=`$catalog_${randomBytes(8).toString('hex')}$`}while(data.includes(tag))
  let operationTag; do {operationTag=`$operation_${randomBytes(8).toString('hex')}$`}while(data.includes(operationTag)||operationTag===tag)
  return `begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
do ${operationTag}
declare item jsonb; previous legalaimcp.listings%rowtype; replacement legalaimcp.listings%rowtype;
begin
  for item in select value from jsonb_array_elements(${tag}${data}${tag}::jsonb) loop
    select * into previous from legalaimcp.listings where id=(item->>'id')::uuid for update;
    if not found or previous.status::text is distinct from item->>'expected_status' or legalaimcp.catalog_claims(to_jsonb(previous)) <> item->'expected_claims' then
      raise exception 'Catalog changed since inspection; whole import refused';
    end if;
    replacement := jsonb_populate_record(null::legalaimcp.listings,item->'listing');
    if replacement.status='published' then
      insert into legalaimcp.catalog_reviews(slug,claims,reviewer,reviewed_at,evidence)
      values(replacement.slug,legalaimcp.catalog_claims(item->'listing'),item->'review'->>'reviewer',(item->'review'->>'reviewed_at')::date,item->'review')
      on conflict(slug) do update set claims=excluded.claims,reviewer=excluded.reviewer,reviewed_at=excluded.reviewed_at,evidence=excluded.evidence,updated_at=now();
    end if;
    update legalaimcp.listings set
      name=replacement.name,tagline=replacement.tagline,description=replacement.description,category=replacement.category,
      external_url=replacement.external_url,mcp_repo_url=replacement.mcp_repo_url,mcp_install_command=replacement.mcp_install_command,
      pricing_model=replacement.pricing_model,pricing_details=replacement.pricing_details,tags=replacement.tags,
      creator_name=replacement.creator_name,creator_url=replacement.creator_url,logo_url=replacement.logo_url,firm_size_fit=replacement.firm_size_fit,
      status=replacement.status,verified=false,verified_at=null
    where id=previous.id;
  end loop;
end;
${operationTag};
${rollback?'rollback':'commit'};`
}

async function main() {
  const argv=process.argv.slice(2), file=argv.find(x=>!x.startsWith('--'))
  if (!file&&!argv.includes('--audit')) throw Error('Usage: node --env-file=.env.local scripts/import-reviewed-catalog.mjs PLAN.json [--apply|--rollback-test] or --audit')
  if (new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname !== `${PROJECT}.supabase.co`) throw Error('Unexpected database project')
  if(argv.includes('--audit')){
    const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{db:{schema:'legalaimcp'},auth:{persistSession:false}})
    const report=await auditPublishedCatalog(db);console.log(JSON.stringify(report));if(!report.ok)process.exitCode=2;return
  }
  const plan=JSON.parse(await readFile(resolve(file),'utf8')), gate=await loadCatalogGate()
  const checked=await validateImport(plan,gate)
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{db:{schema:'legalaimcp'},auth:{persistSession:false}})
  const {data:rows,error}=await db.from('listings').select(['id','status',...gate.CATALOG_CLAIM_FIELDS].join(',')).in('id',checked.map(x=>x.id))
  if(error || rows.length !== checked.length) throw Error('Could not read every existing correction target')
  for(const item of checked){const row=rows.find(r=>r.id===item.id);if(row.status!==item.expected_status||gate.catalogFingerprint(row)!==gate.catalogFingerprint(item.expected_claims))throw Error(`Before-state conflict: ${item.listing.slug}`)}
  console.log(`Validated ${checked.length} exact corrections and current primary evidence; ${checked.filter(x=>x.review).length} publish, ${checked.filter(x=>!x.review).length} quarantine.`)
  if(!argv.includes('--apply')&&!argv.includes('--rollback-test')){console.log('Dry run: no data written.');return}
  if(!process.env.SUPABASE_ACCESS_TOKEN)throw Error('Existing Management API credential required; no anonymous writes or fallback')
  const response=await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`,{method:'POST',headers:{Authorization:`Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:importSQL(checked,{rollback:argv.includes('--rollback-test')})}),signal:AbortSignal.timeout(45000)})
  if(!response.ok)throw Error(`Atomic correction import failed (HTTP ${response.status}); inspect transaction outcome before retry`)
  await response.json()
  console.log(argv.includes('--rollback-test')?'SQL gates exercised; transaction rolled back.':'Atomic correction transaction committed; read back every target before claiming completion.')
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1})
