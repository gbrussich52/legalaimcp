// classification: PUBLIC
import test from 'node:test'
import assert from 'node:assert/strict'
import { collect, curlFetch, sourceObservation, normalizeSource, publicURL, fetchText, registryCandidates, validate, report } from './information.mjs'
const now = '2026-10-20T01:00:00.000Z'
const connection = { name: 'Test', slugs: ['test'], source: 'https://developers.harvey.ai/guides/harvey_mcp', reviewed: '2026-10-19' }
const prose = '<nav>changing navigation</nav><main>MCP connector setup. '+ 'Read the administrator permission documentation. '.repeat(10)+'</main>'
const entry = { server: { name: 'io.example/legal', version: '1.0', description: 'Legal discovery', repository: { url: 'https://github.com/example/legal' } }, _meta: { 'io.modelcontextprotocol.registry/official': { status: 'active', isLatest: true } } }
const payload = { servers: [entry], metadata: {} }
const analyze = async () => ({ok:true,model:'fixture',items:[],evidenceCount:1,remoteModelCalls:0})
const protocol = async () => ({ ok: true, toolCount: 4, catalogTotal: 49, version: '1.3.0' })
const get = async u => u.includes('/v0.1/servers') ? JSON.stringify(payload) : prose

test('sources ignore script/nav noise but retain prose and link changes', () => {
 assert.equal(normalizeSource(prose), normalizeSource(prose.replace('changing navigation','different menu')+'<script>nonce</script>'))
 assert.notEqual(normalizeSource(prose),normalizeSource(prose.replace('permission','write access')))
 assert.notEqual(normalizeSource('<a href="https://example.org/a">link</a>'),normalizeSource('<a href="https://example.org/b">link</a>'))
})
test('changed source remains open across runs until an actual dated review; checks never advance review date', () => {
 const first=sourceObservation(connection,prose,null,now)
 const changed=sourceObservation(connection,prose+'New permissions.',first,now)
 assert.equal(changed.state,'changed')
 assert.equal(sourceObservation(connection,prose+'New permissions.',changed,now).state,'changed')
 assert.equal(changed.reviewed,connection.reviewed)
 assert.equal(sourceObservation({...connection,reviewed:'2026-10-20'},prose+'New permissions.',changed,now).state,'unchanged')
 assert.equal(sourceObservation({...connection,reviewed:'2026-08-01'},prose,null,now).reviewDue,true)
})
test('challenge, empty and unrelated source pages cannot establish a green baseline', () => {
 for (const text of ['', '<html>Just a moment. Enable JavaScript and cookies</html>'+prose, 'unrelated text '.repeat(50)]) assert.throws(()=>sourceObservation(connection,text,null,now))
})
test('only allowlisted HTTPS targets; redirects cannot reach local/private/credentialed targets', async () => {
 for (const u of ['http://legalaimcp.com','https://localhost','https://127.0.0.1','https://legalaimcp.com:8443','https://user:pass@legalaimcp.com','https://evil.example']) assert.throws(()=>publicURL(u))
 let calls=0
 await assert.rejects(fetchText(connection.source,{fetcher:async()=>{calls++;return new Response(null,{status:302,headers:{location:'http://127.0.0.1/private'}})}}))
 assert.equal(calls,1)
 await assert.rejects(fetchText(connection.source,{maxBytes:10,fetcher:async()=>new Response(prose)}),/RESPONSE_TOO_LARGE/)
})
test('registry requires current active publisher record and preserves candidate-only status', () => {
 assert.equal(registryCandidates(payload,'legal')[0].accountTested,false)
 assert.equal(registryCandidates(payload,'legal')[0].status,'candidate')
 for (const changes of [{status:'deleted',isLatest:true},{status:'active',isLatest:false}]) assert.deepEqual(registryCandidates({servers:[{...entry,_meta:{'io.modelcontextprotocol.registry/official':changes}}],metadata:{}},'legal'),[])
 assert.throws(()=>registryCandidates({servers:[]},'legal'),/REGISTRY_SCHEMA/)
 assert.equal(registryCandidates({servers:[{...entry,server:{...entry.server,repository:{url:'https://internal.example/private'}}}],metadata:{}},'legal')[0].repository,null)
})
test('one run deduplicates proposals and retains unresolved old candidates; zero new is valid', async () => {
 const first=await collect({connections:[connection],get,protocol,analyze,now})
 assert.equal(first.ok,true);assert.equal(Object.keys(first.candidates).length,1);assert.equal(first.registryQueries,6)
 const second=await collect({connections:[connection],analyze,previous:first,get:async u=>u.includes('/v0.1/servers')?JSON.stringify({servers:[],metadata:{}}):prose,protocol,now:'2026-10-21T01:00:00Z'})
 assert.equal(Object.keys(second.candidates).length,1);assert.equal(second.candidates['io.example/legal'].firstSeen,now)
})
test('source and registry failures do not skip production check and cannot refresh prior green', async () => {
 let checked=false
 const result=await collect({connections:[connection],analyze,get:async()=>{throw Error('secret details')},protocol:async()=>{checked=true;return protocol()},now})
 assert.equal(checked,true);assert.equal(result.ok,false);assert.equal(result.failures.length,7)
 assert(!JSON.stringify(result).includes('secret details'));assert.throws(()=>validate(result,now));assert.match(report(result),/INCOMPLETE/)
})
test('page caps stay red, schema/protocol failures stay red, source-review work stays visible', async () => {
 const result=await collect({connections:[connection],analyze,get:async u=>u.includes('/v0.1/servers')?JSON.stringify({...payload,metadata:{nextCursor:'more'}}):prose,protocol:async()=>{throw Error('failure')},now})
 assert.equal(result.ok,false);assert.equal(result.registryQueries,12);assert.equal(result.truncatedQueries.length,6)
 assert.match(report(result),/page cap reached/);assert.match(report(result),/MCP: FAILED/)
})
test('validator is red on stale, future, interrupted or missing evidence', async () => {
 const connections=Array.from({length:5},(_,i)=>({...connection,slugs:[`test-${i}`]}))
 const result=await collect({connections,get,protocol,analyze,now});validate(result,now)
 for(const mutation of [{ok:false},{checkedAt:'2026-09-01T00:00:00Z'},{checkedAt:'2026-10-21T00:00:00Z'},{checkedAt:'invalid'},{sources:{}},{registryQueries:0},{protocol:null}]) assert.throws(()=>validate({...result,...mutation},now))
})
test('reports escape registry markdown and never embed raw source content', async () => {
 const result=await collect({connections:[connection],get,protocol,analyze,now});result.candidates.evil={...result.candidates['io.example/legal'],name:'[click](evil)\n<script>'}
 const text=report(result);assert(!text.includes('[click](evil)'));assert(!text.includes('<script>'));assert(!text.includes('Read the administrator permission documentation'))
})

test('first failed source observation recovers with a real baseline rather than a permanent false change',()=>{
 const failed={...connection,state:'unreadable'}
 const recovered=sourceObservation(connection,prose,failed,now)
 assert.equal(recovered.state,'unchanged');assert.ok(recovered.baseline)
 assert.equal(sourceObservation(connection,prose,recovered,now).state,'unchanged')
})
test('review decisions persist outside regenerated queue; a new candidate version reopens review',async()=>{
 const decisions={'io.example/legal':{status:'dismissed',version:'1.0',reason:'Not relevant after source review',reviewedAt:now}}
 const first=await collect({connections:[connection],get,protocol,analyze,now,decisions})
 assert(!report(first).includes('- [ ] io.example/legal'))
 const next=await collect({connections:[connection],get:async u=>u.includes('/v0.1/servers')?JSON.stringify({servers:[{...entry,server:{...entry.server,version:'2.0'}}],metadata:{}}):prose,protocol,analyze,now,decisions,previous:first})
 assert(report(next).includes('- [ ] io.example/legal'))
})

test('actual work queue renders local findings, evidence and guidance as unverified text',async()=>{
 const result=await collect({connections:[connection],get,protocol,analyze:async()=>({ok:true,model:'fixture',evidenceCount:1,remoteModelCalls:0,items:[{source_id:'test',source:connection.source,evidence_quote:'MCP connector setup.',finding:'Review the administrator permission documentation.',next_step:'Verify the current administrator access requirements.',verified:false}]}),now})
 const text=report(result);assert.match(text,/Local-model research suggestions/);assert.match(text,/Unverified suggestions/);assert.match(text,/Verify the current administrator access requirements/);assert.match(text,/MCP connector setup/)
})

test('real curl adapter disables user config before all options and never follows redirects itself',async()=>{
 const response=await curlFetch(connection.source,{execute:async(bin,args,options)=>{
  assert.equal(bin,'/usr/bin/curl');assert.equal(args[0],'-q');assert(!args.includes('-L'));assert(!args.includes('--location'));assert(args.includes('--proto'));assert.equal(options.timeout,14000);assert.equal(options.maxBuffer,2050000)
  return {stdout:'public body\nLEGAL_HTTP:200:'}
 }})
 assert.equal(await response.text(),'public body')
})
