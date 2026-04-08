import type { Metadata } from 'next'
import SubmitForm from '../components/SubmitForm'

export const metadata: Metadata = {
  title: 'Submit a Legal AI Tool',
  description:
    'Submit your MCP server or AI integration for inclusion in the LegalAIMCP directory. We review every submission within 48 hours.',
  alternates: { canonical: 'https://legalaimcp.com/submit' },
}

export default function SubmitPage() {
  return (
    <div className="py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-navy mb-3">Submit a Tool</h1>
        <p className="font-body text-charcoal/70 mb-10">
          Built an MCP server or AI integration for legal professionals? We&apos;d love to list it.
          Every submission is manually reviewed for quality.
        </p>
        <SubmitForm />
      </div>
    </div>
  )
}
