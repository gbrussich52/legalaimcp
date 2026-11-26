// Claude, 2026-11-26: pins which "MCP Repository" values render as a link and which print as an endpoint to copy.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { isMcpEndpointUrl } from './mcp-endpoint'

describe('isMcpEndpointUrl', () => {
  // The six listing values Ahrefs reported as external 4XX on 2026-11-26.
  it.each([
    'https://api.venley.ai/mcp',
    'https://mcp.courtrules.app/mcp',
    'https://cite.specterlaw.ai/mcp',
    'https://app.ailex.co.jp/mcp',
    'https://gleanmark.com/mcp',
    'https://www.signal87.ai/mcp',
    'https://mcp.syfert.com/mcp/',
    'https://voicefleet.ai/api/mcp',
    'https://example.com/sse',
  ])('treats %s as an endpoint', (url) => {
    expect(isMcpEndpointUrl(url)).toBe(true)
  })

  it.each([
    'https://github.com/supabase/mcp',
    'https://github.com/awslabs/mcp/tree/main/src/document-loader-mcp-server',
    'https://mcp.captain.legal/connect/',
    'https://docs.example.com/mcp-setup',
    'not a url',
  ])('keeps %s as a link', (url) => {
    expect(isMcpEndpointUrl(url)).toBe(false)
  })
})

describe('listing page', () => {
  const page = readFileSync(resolve(__dirname, '../app/servers/[slug]/page.tsx'), 'utf8')
  it('routes the MCP repository field through isMcpEndpointUrl', () => {
    expect(page).toContain('isMcpEndpointUrl(listing.mcp_repo_url)')
  })
  // Google's software-app rich result requires a rating or review. The directory has neither and must not invent one,
  // so SoftwareApplication markup on listing pages could only ever fail validation (Ahrefs 11/26: 69 pages).
  it('emits no SoftwareApplication JSON-LD', () => {
    expect(page).not.toMatch(/SoftwareApp/)
  })
})
