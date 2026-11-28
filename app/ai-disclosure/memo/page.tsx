import type { Metadata } from 'next'
import Link from 'next/link'
import { PrintButton } from '../../components/PrintButton'
import { AiDisclosureStatus } from '../../components/AiDisclosureLabel'
import { withSocial } from '@/lib/seo-meta'
import {
  ANSWER_LABELS,
  DISCLOSURE_FIELDS,
  DUTIES,
  EXAMPLE_DISCLOSURE,
  completeness,
  getAiDisclosure,
  memoChoices,
  openQuestions,
  type AiDisclosure,
  type FieldAnswer,
} from '@/lib/ai-disclosure'

// Claude Opus 5.5, 2026-11-27: a free one-page vendor diligence memo built from a published AI Disclosure. It reads the
// chosen slug from the address only; nothing the lawyer picks is stored or sent anywhere. Header and footer are hidden
// in print by app/globals.css, and the picker and print button are hidden here.
const baseMetadata: Metadata = {
  title: 'Free Vendor Diligence Memo for Legal AI',
  description:
    'Build a printable one-page diligence memo on a legal AI vendor: each answer, its source, the duty it bears on, and what to ask the vendor next.',
  alternates: { canonical: 'https://legalaimcp.com/ai-disclosure/memo' },
}

function pick(slug: string | string[] | undefined): AiDisclosure {
  const s = typeof slug === 'string' ? slug : undefined
  return (s && /^[a-z0-9-]{1,100}$/.test(s) && getAiDisclosure(s)) || EXAMPLE_DISCLOSURE
}

export default async function DiligenceMemoPage({ searchParams }: { searchParams: Promise<{ slug?: string | string[] }> }) {
  const d = pick((await searchParams).slug)
  const choices = memoChoices()
  const c = completeness(d)
  const questions = openQuestions(d)

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 font-body text-charcoal print:py-0 print:text-[11px]">
      <nav aria-label="Breadcrumb" className="text-sm text-charcoal/80 mb-6 print:hidden">
        <Link href="/ai-disclosure" className="hover:text-gold-text">AI Disclosure</Link>
        <span className="mx-2">/</span>
        <span>Diligence memo</span>
      </nav>

      <div className="print:hidden">
        <h1 className="font-display text-4xl font-bold text-navy">Free vendor diligence memo</h1>
        <p className="text-lg text-charcoal/80 leading-relaxed mt-3">
          Pick a tool with a published AI Disclosure. You get a one-page memo for your file: each answer, its source, the duty
          it bears on, and what to ask the vendor about anything not disclosed.
        </p>
        <form method="get" action="/ai-disclosure/memo" className="mt-6 flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-sm font-sans font-semibold text-navy">
            Tool
            <select name="slug" defaultValue={d.slug} className="mt-1 rounded-lg border border-slate-300 px-3 py-2 font-body font-normal text-charcoal">
              {choices.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.product} ({o.vendor}){o.fictional ? ', fictional example' : ''}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-primary">Build memo</button>
        </form>
        {choices.length === 1 && (
          <p className="text-sm text-charcoal/75 mt-3">
            No vendor has published a disclosure yet, so only the made-up example is listed.
          </p>
        )}
        <PrintButton />
      </div>

      <article className="mt-10 rounded-xl border border-slate-300 p-6 print:mt-0 print:border-0 print:p-0" aria-labelledby="memo-title">
        <p className="font-sans text-xs uppercase tracking-widest text-gold-text">Vendor diligence memo</p>
        <h2 id="memo-title" className="font-display text-2xl font-bold text-navy mt-1">
          {d.product}, {d.vendor}
        </h2>
        {d.fictional && (
          <p className="mt-2 font-semibold text-gold-text">Fictional example. This vendor and its answers are made up.</p>
        )}
        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
          <AiDisclosureStatus disclosure={d} />
          <span>Answered {c.answered} of {c.total}. Disclosure published {d.publishedAt}.</span>
        </div>
        <p className="mt-4 text-sm">Prepared by: ______________________ &nbsp; Date: ______________ &nbsp; Matter or use: ______________________</p>

        <table className="mt-6 w-full text-left text-sm border-collapse">
          <thead className="border-b border-slate-300 text-navy font-sans">
            <tr>
              <th scope="col" className="py-2 pr-3">Question</th>
              <th scope="col" className="py-2 pr-3">Answer</th>
              <th scope="col" className="py-2 pr-3">Source</th>
              <th scope="col" className="py-2">Duty</th>
            </tr>
          </thead>
          <tbody>
            {DISCLOSURE_FIELDS.map((f) => {
              const a: FieldAnswer = d.answers[f.id] ?? { answer: 'not_disclosed' }
              return (
                <tr key={f.id} className="border-b border-slate-200 align-top break-inside-avoid">
                  <th scope="row" className="py-2 pr-3 font-normal">{f.label}</th>
                  <td className="py-2 pr-3">
                    <span className="font-semibold">{ANSWER_LABELS[a.answer]}</span>
                    {a.detail && <span className="block text-charcoal/75">{a.detail}</span>}
                  </td>
                  <td className="py-2 pr-3 break-all">
                    {a.source ? (
                      <>
                        <a href={a.source.url} target="_blank" rel="nofollow noopener noreferrer" className="text-gold-text underline print:no-underline print:text-charcoal">{a.source.url}</a>
                        {a.source.section && <span className="block">{a.source.section}</span>}
                      </>
                    ) : (
                      'None given'
                    )}
                  </td>
                  <td className="py-2">{f.duties.map((id) => DUTIES[id].label).join('; ')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <section className="mt-6 break-inside-avoid" aria-labelledby="memo-questions">
          <h3 id="memo-questions" className="font-display text-lg font-bold text-navy">Questions to ask the vendor</h3>
          {questions.length ? (
            <ol className="list-decimal pl-6 mt-2 space-y-2 text-sm">
              {questions.map((q) => (
                <li key={q.field.id}>
                  <span className="font-semibold">{q.field.label}</span>
                  {q.reason === 'not_disclosed' ? ' (not disclosed): ' : ' (answered, follow up): '}
                  {q.question}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm mt-2">Every question is answered. Read the cited sections yourself before you rely on them.</p>
          )}
        </section>

        <p className="mt-6 text-xs text-charcoal/75 border-t border-slate-200 pt-3 leading-relaxed">
          Not legal advice; check your own state&apos;s rules. LegalAIMCP is not a law firm. This memo shows what the vendor
          says in public{d.status === 'reviewed' ? ' and that we found it there on the review date' : ', as the vendor reported it; we have not checked it'}.
          It does not test the tool&apos;s security. Duties follow ABA Formal Opinion 512 (July 29, 2024). Standard and sources:
          legalaimcp.com/ai-disclosure.
        </p>
      </article>
    </main>
  )
}

export const metadata: Metadata = withSocial(baseMetadata)
