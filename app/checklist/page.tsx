import type { Metadata } from 'next'
import Link from 'next/link'
import { NYCLAW_CONTACT } from '@/lib/constants'
import { PrintButton } from '../components/PrintButton'

export const metadata: Metadata = {
  title: 'AI Tool Selection Checklist — 10 questions for law firms',
  description:
    'A free 10-question checklist attorneys use to vet AI tools for bar compliance, client data privacy, and actual ROI before buying.',
  // No-index: this is the lead-magnet payload page. We want it accessible to
  // subscribers (so it can be bookmarked) but not competing with our SEO
  // landing pages for organic traffic.
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://legalaimcp.com/checklist' },
}

// The checklist content itself. Lives as a typed array so we can re-render it
// in any form factor (PDF later, email later, in-product printable now).
const CHECKLIST = [
  {
    section: 'Bar compliance & confidentiality',
    items: [
      'Where does my client data go when I use this tool? (local / third-party model / both)',
      'Does the vendor disclose which model it sends prompts to, and where that model is hosted?',
      'Does my state bar permit me to use this tool for the workflow I have in mind? Cite the rule or opinion.',
      'Will I need to disclose AI usage to clients or in pleadings? What does the engagement letter need to say?',
    ],
  },
  {
    section: 'Data handling',
    items: [
      'Is my data used to train the vendor’s models? Can I opt out without losing features?',
      'Does the vendor offer Bring-Your-Own-Key (BYOK) so I control the model relationship directly?',
      'What is the data retention policy — how long do prompts and outputs sit on their servers?',
      'Does it integrate with my case-management system, or does data have to be copied in by hand?',
    ],
  },
  {
    section: 'Real-world fit',
    items: [
      'Have I tested the tool on three real (anonymized) tasks from last week — not a demo dataset?',
      'What is the all-in monthly cost at MY firm size, including seats, overage, and required integrations?',
    ],
  },
] as const

export default function ChecklistPage() {
  return (
    <main className="min-h-screen bg-warm-white py-16 px-6">
      <article className="max-w-3xl mx-auto">
        {/* Eyebrow + title — make the page feel deliverable, not webpage-y */}
        <header className="mb-10 print:mb-6">
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-2">
            AI Tool Selection Checklist · v1
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy leading-tight">
            10 questions to ask before adopting any AI tool at your firm.
          </h1>
          <p className="font-body text-lg text-charcoal/70 mt-4 leading-relaxed">
            Run any vendor through this list. If you can&apos;t get a clear answer
            to a question, that&apos;s your answer. Print, fork, or paste into your
            firm&apos;s vendor-intake doc.
          </p>

          {/* Print affordance — print-to-PDF is the v1 of "the PDF" until we
              ship a real PDF generator. Lives in a tiny client component
              so the rest of this page can stay a server component. */}
          <PrintButton />
        </header>

        {/* The checklist itself — semantic ol/ul so screen readers and print
            both render it correctly without bespoke styling. */}
        <div className="space-y-10 print:space-y-6">
          {CHECKLIST.map((section, sIdx) => (
            <section key={section.section}>
              <h2 className="font-display text-2xl font-bold text-navy border-b-2 border-navy/10 pb-2 mb-4">
                <span className="text-gold-text">{sIdx + 1}.</span> {section.section}
              </h2>
              <ol className="space-y-3">
                {section.items.map((item, iIdx) => (
                  <li
                    key={iIdx}
                    className="flex items-start gap-3 font-body text-charcoal/90 leading-relaxed"
                  >
                    {/* Checkbox is decorative-but-printable — gives the page
                        deliverable-feeling. Not interactive on purpose; users
                        check it on paper or in their tool of choice. */}
                    <span
                      aria-hidden="true"
                      className="mt-1 w-4 h-4 border-2 border-navy/30 rounded shrink-0"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>

        {/* Post-conversion momentum per CRO rule #17 — the visitor JUST opted
            in. They're at peak intent. Don't waste it with a dead-end. */}
        <aside className="mt-14 print:hidden rounded-2xl bg-navy text-white p-8">
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-display">
            Next step
          </p>
          <h3 className="font-display text-2xl font-bold mt-2 leading-tight">
            Need help running the checklist against your actual stack?
          </h3>
          <p className="font-body text-slate-300 mt-3 leading-relaxed">
            NYClaw.io will sit with you for 30 minutes, review the AI tools
            you&apos;re considering, and tell you which ones to skip. Free.
          </p>
          <a
            href={NYCLAW_CONTACT}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block mt-6 bg-gold-display text-navy hover:bg-gold-display/90"
          >
            Book my free 30-minute review →
          </a>
        </aside>

        <div className="mt-10 text-center print:hidden">
          <Link
            href="/servers"
            className="text-gold-text font-sans font-semibold hover:underline"
          >
            ← Browse the directory
          </Link>
        </div>
      </article>
    </main>
  )
}
