import { describe,expect,it,vi } from 'vitest'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
vi.mock('./supabase',()=>({supabase:null}))
import { registerLegalChatgptApp,SHORTLIST_RESOURCE } from './chatgpt-app'
import { widgetHtml } from './chatgpt-widget.generated'
describe('official MCP app protocol',()=>{
 it('advertises strict tool schema, real resource MIME/CSP, and honest errors through SDK transports',async()=>{
  const server=new McpServer({name:'test',version:'1.0.0'});registerLegalChatgptApp(server)
  const client=new Client({name:'review',version:'1.0.0'});const [a,b]=InMemoryTransport.createLinkedPair();await server.connect(a);await client.connect(b)
  try {const {tools}=await client.listTools();expect(tools).toHaveLength(1);expect(tools[0].inputSchema.additionalProperties).toBe(false);expect(tools[0]._meta?.ui).toMatchObject({resourceUri:SHORTLIST_RESOURCE});expect(tools[0].annotations).toMatchObject({readOnlyHint:true,destructiveHint:false,openWorldHint:false});const resources=await client.listResources();expect(resources.resources[0].mimeType).toBe('text/html;profile=mcp-app');const resource=await client.readResource({uri:SHORTLIST_RESOURCE});expect(resource.contents[0]._meta?.ui).toMatchObject({csp:{connectDomains:[],resourceDomains:[],frameDomains:[]}});expect('text' in resource.contents[0] ? resource.contents[0].text : '').toContain('The right tools.');const failed=await client.callTool({name:'build_legal_ai_shortlist',arguments:{workflow:'contracts'}});expect(failed.isError).toBe(true);expect(failed.structuredContent).toBeUndefined();const invalid=await client.callTool({name:'build_legal_ai_shortlist',arguments:{workflow:'contracts',client_document:'do not accept'}});expect(invalid.isError).toBe(true)}finally{await client.close();await server.close()}
 })
 it('ships a self-contained, injection-safe renderer without sales or remote assets',()=>{expect(widgetHtml).not.toMatch(/<script[^>]+src=|<link[^>]+href=|<img|innerHTML\s*=/i);expect(widgetHtml).not.toMatch(/checkout|stripe|pilot|featured placement/i);expect(widgetHtml).toContain('textContent');expect(widgetHtml).toContain('callServerTool')})
})
