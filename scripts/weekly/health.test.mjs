// classification: PUBLIC
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm, chmod } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { withVerifyHealth, writeWeeklyHealth } from './health.mjs'
const execute=promisify(execFile)
const counts={checked:3,alive:1,blocked:1,dead:1,unpublished:1}

test('real run invalidates old green first then stores count-only completion',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'curate-health-'));const file=path.join(dir,'health.json')
 try {
  await writeFile(file,JSON.stringify({ok:true,checkedAt:'old'}))
  await withVerifyHealth(async()=>{assert.equal(JSON.parse(await readFile(file,'utf8')).errorCode,'IN_PROGRESS');return counts},{file})
  const saved=JSON.parse(await readFile(file,'utf8'));assert.equal(saved.ok,true);assert.deepEqual(saved.counts,counts);assert.equal(saved.errorCode,null);assert.ok(Date.parse(saved.checkedAt));assert.deepEqual(Object.keys(saved),['checkedAt','ok','counts','errorCode'])
 } finally {await rm(dir,{recursive:true,force:true})}
})
test('failed and empty results replace previous success; dry-run cannot refresh real health',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'curate-health-'));const file=path.join(dir,'health.json')
 try {
  for(const work of [async()=>{throw new Error('private detail')},async()=>({checked:0})]){
   await writeFile(file,JSON.stringify({ok:true}));await assert.rejects(withVerifyHealth(work,{file}))
   const saved=JSON.parse(await readFile(file,'utf8'));assert.equal(saved.ok,false);assert.equal(saved.errorCode,'VERIFY_FAILED');assert.equal(saved.counts,null);assert.ok(!JSON.stringify(saved).includes('private'))
  }
  const before=await readFile(file,'utf8');await withVerifyHealth(async()=>counts,{file,dryRun:true});assert.equal(await readFile(file,'utf8'),before)
 } finally {await rm(dir,{recursive:true,force:true})}
})
test('weekly wrapper attempts both phases, propagates failures and accepts normal unpublish exit',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'curate-runner-'))
 try {
  const original=await readFile(new URL('./run.sh',import.meta.url),'utf8')
  const runner=path.join(dir,'run.sh');await writeFile(runner,original.replace('ROOT="/Users/gianibrussich/project-claude/legalaimcp"',`ROOT="${dir}"`))
  const node=path.join(dir,'node');await writeFile(node,'#!/bin/bash\nif [ "$1" = scripts/weekly/health.mjs ]; then echo HEALTH_WRITE_\"$#\"; exit 0; fi\nif [ "$2" = verify ]; then exit "$VERIFY_STATUS"; fi\nif [ "$2" = discover ]; then echo DISCOVER_RAN; exit "$DISCOVER_STATUS"; fi\nexit 9\n');await chmod(node,0o755)
  for(const [verify,discover,expected] of [[0,0,0],[1,0,0],[2,0,2],[0,2,2],[2,2,2]]){
   let result
   try{result=await execute('bash',[runner],{env:{...process.env,PATH:`${dir}:${process.env.PATH}`,SUPABASE_ACCESS_TOKEN:'synthetic-placeholder',VERIFY_STATUS:String(verify),DISCOVER_STATUS:String(discover)}});result.code=0}catch(error){result=error}
   assert.equal(result.code,expected);assert.match(result.stdout,/DISCOVER_RAN/);assert.match(result.stdout,/HEALTH_WRITE_2/);assert.match(result.stdout,/HEALTH_WRITE_4/)
  }
 } finally {await rm(dir,{recursive:true,force:true})}
})
test('curation targets shared schema/project and bounds database subprocess',async()=>{
 const source=await readFile(new URL('../curate.mjs',import.meta.url),'utf8')
 assert.match(source,/db: \{ schema: 'legalaimcp' \}/);assert.match(source,/const PROJECT_REF = 'bzrdzchrdthyrhdsodla'/)
 assert.equal((source.match(/UPDATE legalaimcp\.listings SET/g)||[]).length,3);assert.doesNotMatch(source,/UPDATE listings SET/)
 assert.match(source,/\['db', 'query', '--linked', '--project-ref', PROJECT_REF, query\]/)
 assert.match(source,/timeout: 45000/);assert.match(source,/killSignal: 'SIGKILL'/)
 assert.match(source,/listings.length === 0/);assert.match(source,/process.exitCode = 2/)
})


test('weekly artifact invalidates prior completion and only succeeds when both phases do',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'weekly-health-'));const file=path.join(dir,'weekly-health.json')
 try {
  await writeWeeklyHealth(file,0,0)
  await writeWeeklyHealth(file)
  let result=JSON.parse(await readFile(file,'utf8'));assert.equal(result.ok,false);assert.equal(result.errorCode,'IN_PROGRESS');assert.equal(result.verifyExit,null)
  for(const [verify,discover,ok] of [[0,0,true],[1,0,true],[2,0,false],[0,2,false],[2,2,false]]){
   await writeWeeklyHealth(file,verify,discover);result=JSON.parse(await readFile(file,'utf8'))
   assert.equal(result.ok,ok);assert.equal(result.verifyExit,verify);assert.equal(result.discoverExit,discover);assert.ok(Date.parse(result.checkedAt))
  }
 } finally {await rm(dir,{recursive:true,force:true})}
})
