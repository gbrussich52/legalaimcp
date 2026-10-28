import type { Metadata } from 'next'
import { ReviewedConnectionGuide } from '@/app/components/ReviewedConnectionGuide'

export const metadata: Metadata = {'title': 'Connect Claude to Clio: Reviewed Community Setup', 'description': 'This reference covers CHLEGAL’s community implementation. It does not establish that your account is eligible or that a deployment is safe.', 'alternates': {'canonical': 'https://legalaimcp.com/guides/connect-claude-to-clio'}}

export default function Guide() {
  return <ReviewedConnectionGuide slug='clio-matter-manager' title='Connect Claude to Clio: Reviewed Community Setup' lead='This reference covers CHLEGAL’s community implementation. It does not establish that your account is eligible or that a deployment is safe.' />
}
