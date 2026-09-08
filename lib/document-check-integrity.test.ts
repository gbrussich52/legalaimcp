import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
const read=(file:string)=>readFileSync(resolve(__dirname,'..',file),'utf8')
describe('document demo data-flow and claims gate',()=>{
 it('has no upload, persistence, telemetry or server action in its input path',()=>{
  for(const file of ['lib/document-check.ts','lib/document-check-webmcp.ts','app/document-check/checker.tsx','app/document-check/use-document-check-webmcp.ts']){
   expect(read(file),file).not.toMatch(/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|@vercel\/analytics|['"]use server['"]|dangerouslySetInnerHTML|type=["']file["']/)
  }
  expect(existsSync(resolve(__dirname,'../app/api/document-check'))).toBe(false)
 })
 it('offers a fixed assessment destination without serializing form inputs',()=>{
  expect(read('app/document-check/checker.tsx')).toContain('/workflow-assessment')
  expect(read('app/document-check/checker.tsx')).not.toMatch(/URLSearchParams|window\.location|encodeURIComponent|JSON\.stringify/)
 })
 it('does not claim document extraction, certification or validated customer savings',()=>{
  for(const file of ['app/document-check/page.tsx','app/document-check/checker.tsx'])expect(read(file)).not.toMatch(/guaranteed complete|certified compliant|automatically reads your files|save \d+ hours|trusted by \d+/i)
 })
})
