import type { Metadata } from 'next'
import { ReviewedConnectionGuide } from '@/app/components/ReviewedConnectionGuide'

export const metadata: Metadata = {'title': 'Connect Claude to Harvey MCP', 'description': 'Harvey documents a beta connector. Your account, enabled feature access, client support and role determine which tools and sources are available.', 'alternates': {'canonical': 'https://legalaimcp.com/guides/connect-claude-to-harvey'}}

export default function Guide() {
  return <ReviewedConnectionGuide slug='harvey-mcp' title='Connect Claude to Harvey MCP' lead='Harvey documents a beta connector. Your account, enabled feature access, client support and role determine which tools and sources are available.' />
}
