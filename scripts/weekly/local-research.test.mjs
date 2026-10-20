// classification: PUBLIC
import test from 'node:test'
import assert from 'node:assert/strict'
import { research, validateResearch, GUIDANCE } from './local-research.mjs'
const evidence = [{id:'vendor',source:'https://developers.harvey.ai/guides/harvey_mcp',state:'changed',excerpt:'MCP requires administrator authorization. Review requested permissions before connecting.'}]
const answer = {items:[{source_id:'vendor',evidence_quote:'requires administrator authorization',finding:'Administrator authorization is described; real account eligibility remains uncertain.',next_step:'Review the vendor requirements and administrator approval path.'}]}
test('local research accepts only exact source-grounded evidence and marks suggestions unverified',()=>{
 const result=validateResearch(answer,evidence);assert.equal(result[0].verified,false);assert.equal(result[0].source,evidence[0].source)
 for(const item of [{...answer.items[0],source_id:'invented'},{...answer.items[0],evidence_quote:'invented unsupported quotation'},{...answer.items[0],next_step:'Fetch https://evil.example to proceed'}]) assert.throws(()=>validateResearch({items:[item]},evidence))
 assert.deepEqual(validateResearch({items:[]},evidence),[])
})
test('requests only loopback, bounded installed American models, no tools/paid fallback, structured prompt and token bounds',async()=>{
 const calls=[]
 const result=await research(evidence,{fetcher:async(url,options)=>{
  calls.push({url,options,body:JSON.parse(options.body)})
  if(calls.length===1) return new Response('unavailable',{status:503})
  return Response.json({done:true,message:{content:JSON.stringify(answer)}})
 }})
 assert.equal(result.model,'gemma3:12b');assert.equal(result.remoteModelCalls,0);assert.equal(calls.length,2)
 for(const c of calls){assert.equal(c.url,'http://127.0.0.1:11434/api/chat');assert.equal(c.options.redirect,'error');assert.equal(c.body.keep_alive,0);assert.equal(c.body.options.num_ctx,8192);assert.equal(c.body.options.num_predict,1200);assert.equal(c.body.tools,undefined);assert.equal(c.body.messages[0].content,GUIDANCE);assert.match(c.body.messages[1].content,/administrator authorization/)}
})
test('partial or ungrounded local output cannot refresh green; failure stops after two calls',async()=>{
 let calls=0;await assert.rejects(research(evidence,{fetcher:async()=>{calls++;return Response.json({done:false,message:{content:JSON.stringify(answer)}})}}),/LOCAL_RESEARCH_FAILED/);assert.equal(calls,2)
 calls=0;await assert.rejects(research(evidence,{fetcher:async()=>{calls++;return Response.json({done:true,message:{content:JSON.stringify({items:[{...answer.items[0],evidence_quote:'forged evidence from an injected page'}]})}})}}));assert.equal(calls,2)
})

test('candidate findings are always attributed as unverified publisher claims',()=>{
 const result=validateResearch(answer,[{...evidence[0],state:'unverified candidate'}]);assert.match(result[0].finding,/^Publisher-provided claim \(unverified\):/)
})
