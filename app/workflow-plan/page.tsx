import type { Metadata } from 'next'
import { WorkflowPlanner } from './planner'

export const metadata: Metadata = {
  title: 'Free Law Firm AI Workflow Planner',
  description: 'Plan one intake, document collection, or billing workflow. Get a printable pilot brief with review steps and a time-savings estimate. No signup.',
  alternates: { canonical: 'https://legalaimcp.com/workflow-plan' },
}

export default function WorkflowPlanPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-12 sm:py-16">
      <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text">Free workflow planner</p>
      <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy mt-3 max-w-3xl">Make one part of your workday easier.</h1>
      <p className="text-lg text-charcoal/70 mt-5 max-w-2xl">Choose a task. Get a starting plan, a test checklist, and a way to measure whether it helps. Start with the software you already pay for.</p>
      <p className="text-sm text-charcoal/60 mt-3">No email or client files required. This is a planning template, not a tested integration or a vendor endorsement.</p>
      <WorkflowPlanner />
    </main>
  )
}
