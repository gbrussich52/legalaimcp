import type { Metadata } from 'next'
import { ReviewedConnectionGuide } from '@/app/components/ReviewedConnectionGuide'

export const metadata: Metadata = {'title': 'Connect Claude to CourtListener', 'description': 'Use Free Law Project’s current hosted-server instructions. Confirm available data, account authorization, read/write tools and any separate access charges.', 'alternates': {'canonical': 'https://legalaimcp.com/guides/connect-claude-to-courtlistener'}}

export default function Guide() {
  return <ReviewedConnectionGuide slug='courtlistener-mcp' title='Connect Claude to CourtListener' lead='Use Free Law Project’s current hosted-server instructions. Confirm available data, account authorization, read/write tools and any separate access charges.' />
}
