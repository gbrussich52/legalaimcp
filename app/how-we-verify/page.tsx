import type { Metadata } from 'next'
import Link from 'next/link'
import { FAQJsonLd } from '../components/JsonLd'
import { withSocial } from '@/lib/seo-meta'
import { CHECK_METHODS, FAQS, OPERATOR_METHOD, PAID_SENTENCE } from '@/lib/how-we-verify'
import { NOT_CHECKED } from '@/lib/verification'

// Claude Sonnet 5.5, 2026-11-23: the method page the "Check this yourself" block on every listing links to. It says we are
// not the vendor, what happens before a listing goes up, what each check shows and does not show, and how to repeat it.
// It says nothing about how often checks are re-run: the scheduled job is not installed yet.
const baseMetadata: Metadata = {
  title: 'How we check listings',
  description: 'What LegalAIMCP checks before a legal AI tool is listed, what each check shows and does not show, and the command to repeat it yourself.',
  alternates: { canonical: 'https://legalaimcp.com/how-we-verify' },
}

const h2 = 'font-display text-2xl font-bold text-navy scroll-mt-24'
const link = 'text-gold-text underline'
const code = 'block bg-slate-100 rounded px-3 py-2 mt-1 font-mono text-xs text-charcoal whitespace-pre-wrap break-all select-all'
// On a phone each table row becomes a stacked card; the data-label on each cell prints its column name.
const cell = 'block md:table-cell px-0 md:px-3 py-1 md:py-3 align-top before:block before:text-xs before:font-semibold before:uppercase before:tracking-wide before:text-navy before:content-[attr(data-label)] md:before:hidden'

export default function HowWeVerifyPage() {
  const rows = [...CHECK_METHODS, { id: 'operator', ...OPERATOR_METHOD }]
  return (
    <main className="section-padding">
      <FAQJsonLd faqs={FAQS} />
      <div className="max-w-content mx-auto">
        <h1 className="font-display text-4xl font-bold text-navy">How we check listings</h1>
        <p className="font-body text-lg text-charcoal/80 leading-relaxed mt-4">
          This page says what we check before a legal AI tool goes in the directory, what each check shows, and how you can repeat it yourself.
        </p>

        <div className="space-y-10 mt-10 font-body text-charcoal/80 leading-relaxed">
          <section aria-labelledby="not-vendor">
            <h2 id="not-vendor" className={h2}>We are not the vendor</h2>
            <p className="mt-3">LegalAIMCP is an independent directory. We do not make, sell or run the tools we list.</p>
            <p className="mt-3">Each listing has a block called Check this yourself. It shows what we looked at, the date we looked, and a command for each check. Each listing shows the date of its last check.</p>
            <p className="mt-3">AI agents get the same checks from our MCP server at <code className="font-mono text-sm">https://legalaimcp.com/api/mcp</code>. Call <code className="font-mono text-sm">get_legal_ai_tool</code> with a listing slug. See <Link href="/mcp" className={link}>the MCP page</Link> for setup.</p>
          </section>

          <section aria-labelledby="before-listing">
            <h2 id="before-listing" className={h2}>What happens before a listing goes up</h2>
            <ol className="list-decimal pl-6 mt-3 space-y-2">
              <li>We read the vendor&apos;s own pages and keep short quotes from them. The quotes show what the vendor claims. They do not show that the claims are true.</li>
              <li>We run the checks in the table below and record what we saw, with the date.</li>
              <li>We look for the operator in a public company register. We record what we found, or that we found nothing.</li>
              <li>A person reads the result and says yes before the listing goes up.</li>
            </ol>
          </section>

          <section aria-labelledby="checks">
            <h2 id="checks" className={h2}>What each check shows, and how to repeat it</h2>
            <p className="mt-3">Each check records what we saw on one date. A listing shows only the checks that apply to it. If we could not run a check, the listing says Could not check.</p>
            <table className="mt-5 block md:table w-full text-sm text-left">
              <thead className="hidden md:table-header-group border-b border-slate-300 text-navy font-sans">
                <tr className="md:table-row">
                  <th scope="col" className="px-3 py-2">Check</th>
                  <th scope="col" className="px-3 py-2">What it shows</th>
                  <th scope="col" className="px-3 py-2">What it does not show</th>
                  <th scope="col" className="px-3 py-2">How to repeat it</th>
                </tr>
              </thead>
              <tbody className="block md:table-row-group">
                {rows.map((m) => (
                  <tr key={m.id} className="block md:table-row rounded-lg border border-slate-200 md:border-0 md:border-b p-4 md:p-0 mb-4 md:mb-0">
                    <th scope="row" data-label="Check" className={`${cell} font-sans font-semibold text-navy text-left`}>{m.label}</th>
                    <td data-label="What it shows" className={cell}>{m.shows}</td>
                    <td data-label="What it does not show" className={cell}>{m.doesNotShow}</td>
                    <td data-label="How to repeat it" className={cell}>
                      {m.id === 'operator' ? m.howToRepeat : <code className={code}>{m.howToRepeat}</code>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-sm">Replace example.com, OWNER, REPO and NAME with the values on the listing. Each listing prints the exact command for its own address.</p>
          </section>

          <section aria-labelledby="never">
            <h2 id="never" className={h2}>What we never check</h2>
            <p className="mt-3">We do not do these things:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              {NOT_CHECKED.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p className="mt-3">A passing check is not a recommendation. Run your own review before a tool touches client work.</p>
          </section>

          <section aria-labelledby="paid">
            <h2 id="paid" className={h2}>Paid placements</h2>
            <p className="mt-3">{PAID_SENTENCE}</p>
          </section>

          <section aria-labelledby="report">
            <h2 id="report" className={h2}>Report an error</h2>
            <p className="mt-3">Write to <a href="mailto:hello@legalaimcp.com" className={link}>hello@legalaimcp.com</a>. Say which listing and which line is wrong.</p>
          </section>

          <section aria-labelledby="faq">
            <h2 id="faq" className={h2}>Questions</h2>
            <dl className="mt-4 space-y-5">
              {FAQS.map((f) => (
                <div key={f.q}>
                  <dt className="font-sans font-semibold text-navy">{f.q}</dt>
                  <dd className="mt-1">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <p><Link href="/servers" className="font-sans font-semibold text-gold-text hover:underline">Browse the directory →</Link></p>
        </div>
      </div>
    </main>
  )
}

export const metadata: Metadata = withSocial(baseMetadata)
