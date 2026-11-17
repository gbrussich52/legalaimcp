import type { Metadata } from 'next'
import { ReviewedConnectionGuide } from '@/app/components/ReviewedConnectionGuide'
import { withSocial } from '@/lib/seo-meta'

const baseMetadata: Metadata = {'title': 'Connect Claude to CourtListener', 'description': 'Use Free Law Project’s current hosted-server instructions. Confirm available data, account authorization, read/write tools and any separate access charges.', 'alternates': {'canonical': 'https://legalaimcp.com/guides/connect-claude-to-courtlistener'}}

export default function Guide() {
  return <ReviewedConnectionGuide slug='courtlistener-mcp' title='Connect Claude to CourtListener' lead='Use Free Law Project’s current hosted-server instructions. Confirm available data, account authorization, read/write tools and any separate access charges.' />
}

// Claude Sonnet 5.5, 2026-11-16: og:url and og:image follow this page's own canonical (see withSocial).
export const metadata: Metadata = withSocial(baseMetadata)
