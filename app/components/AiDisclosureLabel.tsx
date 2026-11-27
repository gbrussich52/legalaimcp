import Link from 'next/link'
import {
  ANSWER_LABELS,
  DISCLOSURE_FIELDS,
  completeness,
  nextReviewDue,
  type AiDisclosure,
  type Answer,
  type FieldAnswer,
} from '@/lib/ai-disclosure'

// Claude Opus 5.5, 2026-11-27: the AI Disclosure label. A listing page passes its disclosure, or null; with null it
// says none is published and points to the standard. Source links are vendor pages we do not get paid for, so they
// are nofollow but not sponsored.

const answerClass: Record<Answer, string> = {
  yes: 'bg-slate-100 text-navy',
  no: 'bg-slate-100 text-navy',
  not_disclosed: 'bg-amber-50 text-gold-text',
}

export function AiDisclosureStatus({ disclosure }: { disclosure: AiDisclosure }) {
  if (disclosure.status === 'reviewed') {
    return (
      <span className="text-xs bg-navy text-white rounded-full px-2.5 py-1">
        Reviewed <time dateTime={disclosure.reviewedAt}>{disclosure.reviewedAt}</time>
      </span>
    )
  }
  return <span className="text-xs bg-slate-100 text-charcoal rounded-full px-2.5 py-1">Self-reported, not checked by us</span>
}

export function AiDisclosureLabel({ disclosure, headingLevel = 2 }: { disclosure: AiDisclosure | null; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? 'h2' : 'h3'
  if (!disclosure) {
    return (
      <section className="mb-10 rounded-xl border border-slate-200 bg-slate-50 p-6" aria-labelledby="ai-disclosure-heading">
        <H id="ai-disclosure-heading" className="scroll-mt-24 font-display text-2xl font-bold text-navy">AI disclosure</H>
        <p className="font-body text-charcoal/80 mt-3">
          No AI disclosure published yet. Before you use this tool with client work, ask the vendor the questions in our standard.
        </p>
        <Link href="/ai-disclosure" className="inline-block mt-3 text-gold-text underline">
          See the AI Disclosure standard
        </Link>
      </section>
    )
  }

  const c = completeness(disclosure)
  const due = nextReviewDue(disclosure)
  return (
    <section className="mb-10 overflow-hidden rounded-xl border border-slate-300 break-inside-avoid" aria-labelledby={`ai-disclosure-${disclosure.slug}`}>
      <div className="bg-navy p-6 text-white">
        <p className="font-sans text-xs uppercase tracking-widest text-slate-300">AI Disclosure</p>
        <H id={`ai-disclosure-${disclosure.slug}`} className="scroll-mt-24 font-display text-2xl mt-2">
          {disclosure.product}
        </H>
        <p className="font-body text-slate-200 mt-1">{disclosure.vendor}</p>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <AiDisclosureStatus disclosure={disclosure} />
          {disclosure.fictional && (
            <span className="text-xs bg-amber-50 text-gold-text rounded-full px-2.5 py-1 font-semibold">Fictional example</span>
          )}
          <span className="text-xs text-slate-200">
            Answered {c.answered} of {c.total}
          </span>
        </div>
      </div>
      <dl className="divide-y divide-slate-200 font-body text-sm">
        {DISCLOSURE_FIELDS.map((f) => {
          const a: FieldAnswer = disclosure.answers[f.id] ?? { answer: 'not_disclosed' }
          return (
            <div key={f.id} className="grid gap-1 px-6 py-3 md:grid-cols-[1fr_auto] md:gap-4">
              <dt className="text-charcoal">
                {f.label}
                {a.detail && (
                  <span className="block text-charcoal/75 mt-0.5">
                    {f.detailLabel ? `${f.detailLabel}: ` : ''}
                    {a.detail}
                  </span>
                )}
                {a.source && (
                  <a
                    href={a.source.url}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="block text-xs text-gold-text underline mt-0.5 break-all"
                  >
                    Source{a.source.section ? `: ${a.source.section}` : ''}
                  </a>
                )}
              </dt>
              <dd>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${answerClass[a.answer]}`}>
                  {ANSWER_LABELS[a.answer]}
                </span>
              </dd>
            </div>
          )
        })}
      </dl>
      <div className="border-t border-slate-200 bg-slate-50 p-6 font-body text-xs text-charcoal/75 leading-relaxed">
        {disclosure.status === 'reviewed' ? (
          <p>
            We checked each answer against the vendor&apos;s own pages on {disclosure.reviewedAt}
            {due ? ` and will check again by ${due}` : ''}. A label is information about software, not legal advice.
          </p>
        ) : (
          <p>
            The vendor gave these answers. We have not checked them. A label is information about software, not legal advice.
          </p>
        )}
        <p className="mt-2">
          Published {disclosure.publishedAt}.{' '}
          <Link href="/ai-disclosure" className="text-gold-text underline print:no-underline">What each line means</Link>
        </p>
      </div>
    </section>
  )
}
