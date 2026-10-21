import { beforeEach,describe,expect,it,vi } from 'vitest'
const {lookup}=vi.hoisted(()=>({lookup:vi.fn()}))
vi.mock('@/lib/chatgpt-shortlist',async(importOriginal)=>({...await importOriginal<typeof import('@/lib/chatgpt-shortlist')>(),getShortlist:lookup}))
import { GET } from './route'
beforeEach(()=>lookup.mockReset())
describe('web preview catalog boundary',()=>{
 it('rejects unknown, duplicate and malformed choice inputs before catalog access',async()=>{
  for(const query of ['workflow=contracts&url=http://127.0.0.1','workflow=contracts&workflow=billing','workflow=advice','workflow=contracts&free_only=yes','workflow=contracts&limit=100','workflow=contracts&client_document=private'])expect((await GET(new Request('https://legalaimcp.com/api/chatgpt?'+query))).status).toBe(400)
  expect(lookup).not.toHaveBeenCalled()
 })
 it('passes normalized bounded choices and prevents public caching',async()=>{
  lookup.mockResolvedValueOnce({count:0,tools:[]});const response=await GET(new Request('https://legalaimcp.com/api/chatgpt?workflow=billing&firm_size=solo&free_only=true&limit=3'));expect(response.status).toBe(200);expect(lookup).toHaveBeenCalledWith({workflow:'billing',firm_size:'solo',free_only:true,limit:3});expect(response.headers.get('cache-control')).toBe('no-store')
 })
 it('reports lookup failure without fixtures or internal error detail',async()=>{
  lookup.mockRejectedValueOnce(new Error('private database diagnostic'));const response=await GET(new Request('https://legalaimcp.com/api/chatgpt?workflow=contracts'));expect(response.status).toBe(503);const body=await response.json();expect(body.error).toContain('no sample results');expect(body.error).not.toContain('private database')
 })
})
