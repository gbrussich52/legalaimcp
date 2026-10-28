import {describe,it,expect} from 'vitest'
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {auditPublishedCatalog} from '../scripts/import-reviewed-catalog.mjs'
const db=(data:unknown[],error:unknown=null)=>({from:()=>({select:()=>({eq:async()=>({data,error})})})})
describe('source-change sensor',()=>{
 it('invalidates prior success and preserves actionable failures instead of accepting changed evidence',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'catalog-sensor-'));const file=join(dir,'health.json')
  try{
   await writeFile(file,JSON.stringify({ok:true,checkedAt:'2026-01-01'}))
   const gate={CATALOG_CLAIM_FIELDS:['slug'],assertCatalogReview:async()=>{throw Error('Primary source changed; review required')}}
   const result=await auditPublishedCatalog(db([{slug:'changed-product'}]),{output:file,gate})
   expect(result.ok).toBe(false);expect(result.findings[0].slug).toBe('changed-product')
   expect(JSON.parse(await readFile(file,'utf8')).ok).toBe(false)
   expect(await readFile(join(dir,'catalog-improve.md'),'utf8')).toContain('Do not rewrite claims')
  }finally{await rm(dir,{recursive:true})}
 })
 it('does not treat an empty catalog or failed read as successful verification',async()=>{
  const gate={CATALOG_CLAIM_FIELDS:['slug'],assertCatalogReview:async()=>{}}
  await expect(auditPublishedCatalog(db([]),{output:false,gate})).rejects.toThrow('incomplete')
 })
 it('deduplicates shared primary sources while checking each product',async()=>{
  let requests=0,checked=0
  const gate={CATALOG_CLAIM_FIELDS:['slug'],assertCatalogReview:async(_row:unknown,{fetcher}:{fetcher:typeof fetch})=>{checked++;const r=await fetcher('https://vendor.example/docs');expect(await r.text()).toBe('Source text')}}
  const result=await auditPublishedCatalog(db([{slug:'one'},{slug:'two'}]),{output:false,gate,fetcher:async()=>{requests++;return new Response('Source text')}})
  expect(result.ok).toBe(true);expect(result.checked).toBe(2);expect(checked).toBe(2);expect(requests).toBe(1)
 })
})
