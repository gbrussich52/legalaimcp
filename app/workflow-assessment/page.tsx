import type { Metadata } from 'next'
import Link from 'next/link'
import { AssessmentBooking } from '../components/AssessmentBooking'

export const metadata: Metadata = {
  title: 'Law Firm AI Workflow Assessment',
  description: 'Scope one intake, document collection, or billing workflow with NYClaw. Get a software review, pilot plan, and written implementation scope.',
  alternates: { canonical: 'https://legalaimcp.com/workflow-assessment' },
}

export default function AssessmentPage() {
  return <main className="max-w-4xl mx-auto px-6 py-16">
    <p className="text-xs font-semibold uppercase tracking-widest text-gold-text">For solo and small law firms · Delivered by NYClaw</p>
    <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy mt-4">One workflow. A clear plan before you buy more software.</h1>
    <p className="text-xl text-charcoal/70 leading-relaxed mt-6">You have tools. You still spend time chasing documents, following up on inquiries, or preparing invoices. A workflow assessment identifies what you can improve with your current setup and what would need an integration.</p>
    <div className="mt-8"><AssessmentBooking /><p className="text-sm text-charcoal/60 mt-3">The initial fit call is free. Assessment scope and a fixed fee are agreed in writing before paid work begins. No payment is taken here.</p></div>
    <section className="my-12 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
      <h2 className="font-display text-2xl font-bold text-navy">What the assessment delivers</h2>
      <ul className="mt-5 space-y-4 list-disc pl-5">
        <li><strong>A map of one workflow:</strong> the trigger, software, handoffs, and person responsible.</li>
        <li><strong>A feasibility check:</strong> built-in features first, then documented integrations, required permissions, and unresolved questions.</li>
        <li><strong>A pilot brief:</strong> fictional test cases, review steps, success criteria, and a way to stop or roll back.</li>
        <li><strong>A written recommendation:</strong> configure existing software, buy a tool, build an integration, or leave the process manual. Implementation is quoted separately.</li>
      </ul>
    </section>
    <section className="my-12 grid md:grid-cols-3 gap-5">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5"><h2 className="font-display text-xl font-bold text-navy">One approved checklist</h2><p className="mt-3 text-sm text-charcoal/70 leading-relaxed">We start with one document or intake checklist your team already understands.</p></div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5"><h2 className="font-display text-xl font-bold text-navy">Ten redacted examples</h2><p className="mt-3 text-sm text-charcoal/70 leading-relaxed">We define ten authorized, redacted or fictional examples for staff review before any broader pilot.</p></div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5"><h2 className="font-display text-xl font-bold text-navy">Useful signals</h2><p className="mt-3 text-sm text-charcoal/70 leading-relaxed">We compare useful findings, staff time, and false alarms so the next decision has a clear record.</p></div>
    </section>
    <section className="grid sm:grid-cols-2 gap-8 my-12">
      <div><h2 className="font-display text-2xl font-bold text-navy">A useful first project</h2><p className="mt-3 text-charcoal/75">Start with inquiry follow-up, missing-document requests, or invoice preparation. We define a draft-and-review process with a measurable starting point.</p></div>
      <div><h2 className="font-display text-2xl font-bold text-navy">Clear boundaries</h2><p className="mt-3 text-charcoal/75">The assessment covers software and process design. It does not include legal advice, ethics certification, autonomous conflict decisions, or court-deadline management.</p></div>
    </section>
    <section className="border-t border-slate-200 pt-8 space-y-5">
      <h2 className="font-display text-2xl font-bold text-navy">Before the call</h2>
      <p>Bring the names of your software, a description of one repetitive task, and a rough monthly volume. Use fictional examples. Do not send client records or account credentials.</p>
      <p>Any paid pilot or implementation starts with a written scope and fee. The fit call is free, and no paid work begins from this page.</p>
      <p>NYClaw builds and funds LegalAIMCP and may quote the implementation. The assessment is not an independent legal or security audit. Vendor subscriptions and support arrangements are agreed separately.</p>
      <p><Link className="text-gold-text font-semibold underline" href="/document-check">Try the document check demo →</Link></p>
      <p><Link className="text-gold-text font-semibold underline" href="/workflow-plan">Build a free workflow plan first →</Link></p>
    </section>
  </main>
}
