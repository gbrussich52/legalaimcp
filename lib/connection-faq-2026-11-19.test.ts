// Grok Bot (Crack Bot), 2026-11-19, why: guards the iManage Work and Ironclad listing-page lead and FAQ copy.
// Every answer is tied to a vendor help page read on 2026-11-19 (see the comments in lib/connections.ts).
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ConnectionFaqs, ConnectionLead } from '../app/components/SoftwareConnection'
import { getSoftwareConnection } from './connections'

// Each iManage page the FAQ answers rely on must stay cited.
const IMANAGE = [
  'https://docs.imanage.com/ai/mcpserver-user-help/en-US/Adding_MCP_connectors_for_Claude.html',
  'https://docs.imanage.com/ai/mcpserver-user-help/en-US/Adding_iManage_connectors_for_MCP-enabled_clients.html',
  'https://docs.imanage.com/ai/mcpserver-user-help/en-US/Tools_available_for_each_MCP_connector.html',
]

const cases = [
  { slug: 'imanage-work', host: 'docs.imanage.com', query: /imanage/i, sources: IMANAGE },
  { slug: 'ironclad', host: 'support.ironcladapp.com', query: /ironclad/i, sources: ['https://support.ironcladapp.com/hc/en-us/articles/39887632957463-Connect-an-MCP-Client-to-Ironclad-MCP-Server'] },
]

describe('iManage Work and Ironclad connection FAQs', () => {
  for (const { slug, host, query, sources } of cases) {
    const c = getSoftwareConnection(slug)!
    it(`${slug}: FAQ markup equals the visible FAQ, and every source is the vendor's own page`, () => {
      const html = renderToStaticMarkup(createElement(ConnectionFaqs, { slug }))
      const ld = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)
      expect(ld).toBeTruthy()
      const json = JSON.parse(ld![1]!.replace(/\\u003c/g, '<'))
      expect(json['@type']).toBe('FAQPage')
      expect(json.mainEntity.map((e: { name: string }) => e.name)).toEqual(c.faqs!.map(f => f.q))
      expect(json.mainEntity.map((e: { acceptedAnswer: { text: string } }) => e.acceptedAnswer.text)).toEqual(c.faqs!.map(f => f.a))
      expect(c.faqs!.length).toBeGreaterThanOrEqual(4)
      expect(c.faqsChecked).toBe('2026-11-19')
      for (const s of c.faqSources!) expect(new URL(s.url).host).toBe(host)
      expect(c.faqSources!.map(s => s.url)).toEqual(expect.arrayContaining(sources))
      expect(new URL(c.source).host).toBe(host)
    })
    it(`${slug}: lead answers the query first and stays near 50 words`, () => {
      expect(c.lead).toMatch(query)
      const words = c.lead!.split(/\s+/).length
      expect(words).toBeGreaterThanOrEqual(35)
      expect(words).toBeLessThanOrEqual(65)
      expect(renderToStaticMarkup(createElement(ConnectionLead, { slug }))).toContain('MCP')
      expect(c.serverName).toMatch(/MCP server$/)
    })
  }

  it('iManage copy does not claim write access and names the admin setup step', () => {
    const c = getSoftwareConnection('imanage-work')!
    const text = JSON.stringify(c.faqs)
    expect(text).toMatch(/only read permissions are available and selected by default/)
    expect(text).toMatch(/iManage MCP Control Center Extension and the iManage MCP Service/)
    expect(text).not.toMatch(/cloudimanage\.com/) // tenant URLs depend on the firm's subdomain; we do not print them
  })

  it('Ironclad copy says the obligation tools can change data, and its URLs match the setup panel', () => {
    const c = getSoftwareConnection('ironclad')!
    const text = JSON.stringify(c.faqs)
    expect(text).toMatch(/Not all of it/)
    expect(text).toMatch(/Obligations add-on/)
    for (const url of text.match(/https:\/\/mcp\.[a-z0-9.]+\/mcp/g) ?? []) expect(c.setup).toContain(url)
    expect(text).toMatch(/https:\/\/mcp\.na1\.ironcladapp\.com\/mcp/)
  })
})
