import Link from 'next/link'
import type { ListingDetailData } from '@/lib/types'
import { CHECK_LABELS, METHOD_PATH, resultLabel, getVerificationSource, hostnameOf, httpsHref, publicChecks, textFragmentUrl, type VerificationSource } from '@/lib/verification'

// Claude Sonnet 5.5, 2026-11-23: this card used to print only the review date and the source hostnames. It is now the
// "Check this yourself" block: what the vendor says (quoted, with a link that scrolls to the quote), what we observed
// with a command to repeat each check, who is behind the product, and what we did not check. Why: a reader or an AI
// agent that pulls a listing must see that LegalAIMCP is not the vendor and how to repeat each check without us.
// Every value comes from lib/catalog-realness.json and lib/catalog-reviews.json. Stored text is untrusted: React
// renders it as text, and only https URLs become links. The internal level and reasons are never printed.

const RESULT_STYLE: Record<string, string> = {
  pass: 'bg-emerald-50 text-emerald-900',
  warn: 'bg-amber-100 text-amber-900',
  fail: 'bg-red-50 text-red-900',
  unknown: 'bg-slate-200 text-charcoal',
}
const h3 = 'font-sans font-semibold text-navy'
const note = 'font-body text-sm text-charcoal/75 mt-1'
const link = 'text-gold-text underline break-words'

export function CheckThisYourself({ name, source }: { name: string; source: VerificationSource }) {
  const { record, review, operator } = source
  const checks = publicChecks(record)
  const quotes = (review?.sources ?? []).filter((s) => s.show !== false && httpsHref(s.url) !== null && String(s.quote ?? '').trim() !== '')
  const operatorHref = operator && 'url' in operator ? httpsHref(operator.url) : null
  return (
    <section id="check-this-yourself" className="scroll-mt-24 mb-10 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-6" aria-labelledby="check-yourself-heading">
      <h2 id="check-yourself-heading" className="font-display text-2xl font-bold text-navy">Check this yourself</h2>
      <p className="font-body text-charcoal/80 mt-3 leading-relaxed">LegalAIMCP is an independent directory. We do not make, sell or run {name}. Here is what we looked at, the date we looked, and how to repeat each check without us.</p>

      <div className="mt-6 space-y-7 font-body text-sm leading-relaxed">
        <div>
          <h3 className={h3}>What the vendor says</h3>
          <p className={note}>These lines are quoted from the vendor&apos;s or maintainer&apos;s own pages. They show what is claimed, not that it is true.</p>
          {quotes.length > 0 && (
            <ul className="mt-3 space-y-4">
              {quotes.map((s, i) => (
                <li key={`${s.url}-${i}`} className="border-l-2 border-gold/60 pl-3">
                  <p className="text-charcoal break-words">“{s.quote}”</p>
                  <p className="text-xs text-charcoal/75 mt-1">
                    <a href={textFragmentUrl(s.url, s.quote)} target="_blank" rel="noopener noreferrer" className={link}>{hostnameOf(s.url)} ↗</a>
                    {' '}· reviewed <time dateTime={review!.reviewed_at}>{review!.reviewed_at}</time>
                  </p>
                </li>
              ))}
            </ul>
          )}
          {quotes.length === 0 && <p className="text-charcoal/80 mt-3">No vendor quotes are attached to this listing yet.</p>}
        </div>

        <div>
          <h3 className={h3}>What we observed</h3>
          {record === null ? (
            <p className="text-charcoal/80 mt-1">Not checked yet.</p>
          ) : (
            <>
              <p className={note}>We ran these checks ourselves on <time dateTime={record.checked_at}>{record.checked_at}</time>. Each one shows what we saw and a command you can run to see it too.</p>
              <ul className="mt-3 space-y-5">
                {checks.map((check) => (
                  <li key={check.id}>
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-sans font-semibold text-navy">{CHECK_LABELS[check.id] ?? check.id}</span>
                      <span className={`text-xs rounded-full px-2.5 py-0.5 ${RESULT_STYLE[check.result] ?? RESULT_STYLE.unknown}`}>{resultLabel(check)}</span>
                    </p>
                    <p className="text-charcoal/80 mt-1 break-words">{check.observed}</p>
                    <code className="block bg-slate-100 rounded px-3 py-2 mt-2 font-mono text-xs text-charcoal whitespace-pre-wrap break-all select-all">{check.how_to_repeat}</code>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div>
          <h3 className={h3}>Who is behind it</h3>
          {operator && 'name' in operator ? (
            <p className="text-charcoal/80 mt-1 break-words">
              {operator.name}, listed in {operatorHref ? <a href={operatorHref} target="_blank" rel="noopener noreferrer" className={link}>{operator.register}</a> : operator.register} as {operator.status}{operator.formed ? `, formed ${operator.formed}` : ''}. Checked <time dateTime={operator.checked_at}>{operator.checked_at}</time>.
            </p>
          ) : operator ? (
            <p className="text-charcoal/80 mt-1 break-words">We looked for the operator in a public company register and did not find one. {operator.note}</p>
          ) : (
            <p className="text-charcoal/80 mt-1">We have not yet looked this operator up in a company register.</p>
          )}
        </div>

        <div>
          <h3 className={h3}>What we did not check</h3>
          <p className="text-charcoal/80 mt-1">We did not open a customer account, use the product on a real matter, test its security, or check any legal output for accuracy. A passing check here is not a recommendation.</p>
        </div>

        <p><Link href={METHOD_PATH} className="text-gold-text font-semibold underline">How we check listings</Link></p>
      </div>
    </section>
  )
}

export function CatalogSources({ listing }: { listing: ListingDetailData }) {
  return <CheckThisYourself name={listing.name} source={getVerificationSource({ ...listing })} />
}
