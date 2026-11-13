import type { Metadata } from 'next'
import { ReviewedConnectionGuide } from '@/app/components/ReviewedConnectionGuide'

// Claude Sonnet 5.5, 2026-11-12: page title fit to <= 60 with brand (was 61); h1 keeps the long form
export const metadata: Metadata = {'title': 'Connect Claude to Clio: Community Setup', 'description': 'This reference covers CHLEGAL’s community implementation. It does not establish that your account is eligible or that a deployment is safe.', 'alternates': {'canonical': 'https://legalaimcp.com/guides/connect-claude-to-clio'}}

// Claude Sonnet 5.5, 2026-11-12: lead now points to Clio's own documented connector (see lib/connections.ts), which this page's panel shows.
export default function Guide() {
  return <ReviewedConnectionGuide slug='clio-matter-manager' title='Connect Claude to Clio: Reviewed Community Setup' lead='This reference covers CHLEGAL’s community implementation. Clio also documents its own Claude connector for Clio Work, shown below with its source. Neither one establishes that your account is eligible or that a deployment is safe.' />
}
