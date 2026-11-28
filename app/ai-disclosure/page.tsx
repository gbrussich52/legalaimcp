import type { Metadata } from 'next'
import Link from 'next/link'
import { FAQJsonLd } from '../components/JsonLd'
import { AiDisclosureLabel } from '../components/AiDisclosureLabel'
import { withSocial } from '@/lib/seo-meta'
import {
  DISCLOSURE_FIELDS,
  DISCLOSURE_SOURCES,
  DUTIES,
  EXAMPLE_DISCLOSURE,
  ILLINOIS_ITEMS,
  PUBLISH_MAILTO,
  REVIEWED_MAILTO,
  REVIEWED_PRICE_USD,
  REVIEW_INTERVAL_DAYS,
  SOURCES_READ_ON,
} from '@/lib/ai-disclosure'

// Claude Opus 5.5, 2026-11-27: the AI Disclosure standard. One fixed set of questions a legal AI vendor answers in
// public, each tied to the lawyer duty it serves. The only vendor shown is made up. Every claim about an ethics opinion
// below was read on 2026-11-27 in the sources listed at the bottom of the page.
const baseMetadata: Metadata = {
  title: 'AI Disclosure for Legal AI Tools',
  description:
    'A free, standard AI disclosure label for legal AI vendors, mapped to ABA Formal Opinion 512. See what a tool does with client data, line by line.',
  alternates: { canonical: 'https://legalaimcp.com/ai-disclosure' },
}

const PRICE = `$${REVIEWED_PRICE_USD.toLocaleString('en-US')}`

const AI_DISCLOSURE_FAQS = [
  {
    q: 'What is an AI Disclosure?',
    a: `A public label with ${DISCLOSURE_FIELDS.length} fixed questions about how a legal AI tool handles data. Each answer is yes, no or not disclosed, with a link to the vendor page it comes from.`,
  },
  {
    q: 'Does it cost a vendor anything to publish one?',
    a: 'No. Publishing a self-reported disclosure is free, and reading one is free.',
  },
  {
    q: 'What does the Reviewed tier add?',
    a: `For ${PRICE} a year we check every answer against the vendor's own terms, privacy policy and trust page, cite the section, and check again every ${REVIEW_INTERVAL_DAYS} days. The label then shows Reviewed and the review date.`,
  },
  {
    q: 'Can a vendor pay to change an answer?',
    a: 'No. A paid review checks the answers. It never changes them. If the terms say yes, the label says yes.',
  },
  {
    q: 'Is this legal advice?',
    a: 'No. LegalAIMCP is not a law firm. The label is information about software. Check your own state\'s rules and opinions before you rely on it.',
  },
] as const

const h2 = 'font-display text-2xl font-bold text-navy scroll-mt-24'
const link = 'text-gold-text underline'
const cell = 'block md:table-cell px-0 md:px-3 py-1 md:py-3 align-top before:block before:text-xs before:font-semibold before:uppercase before:tracking-wide before:text-navy before:content-[attr(data-label)] md:before:hidden'

export default function AiDisclosurePage() {
  return (
    <main className="section-padding">
      <FAQJsonLd faqs={AI_DISCLOSURE_FAQS} />
      <div className="max-w-content mx-auto">
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-2">Free standard</p>
        <h1 className="font-display text-4xl font-bold text-navy">AI Disclosure: one label for every legal AI tool</h1>
        <p className="font-body text-lg text-charcoal/80 leading-relaxed mt-4">
          Before you put client work into an AI tool, you need to know what the tool does with it. This page sets out{' '}
          {DISCLOSURE_FIELDS.length} plain questions any vendor can answer in public, in the same order, with a link to where
          each answer comes from. Vendors publish for free. Lawyers read for free.
        </p>

        <div className="space-y-12 mt-10 font-body text-charcoal/80 leading-relaxed">
          <section aria-labelledby="why">
            <h2 id="why" className={h2}>Why this exists</h2>
            <p className="mt-3">
              On July 29, 2024 the ABA issued Formal Opinion 512, its first ethics opinion on generative AI. It says a lawyer
              should read and understand a tool&apos;s terms of use, privacy policy and related contract terms, or ask
              someone who has. It also says a lawyer must make sure an outside provider will protect confidential
              information.
            </p>
            <p className="mt-3">
              In practice that means a firm reads the same legal pages for every tool, one at a time. Many firms send vendors
              a security questionnaire instead. In 2021 Law.com quoted a credentialing group&apos;s president who had seen
              one law firm questionnaire run to 1,400 questions.
            </p>
            <p className="mt-3">
              We could not find a shared, public format that every legal AI vendor fills in the same way. So we wrote a
              short one. It does not replace your own review. It gives you a place to start and a list of what to ask.
            </p>
          </section>

          <section aria-labelledby="fields">
            <h2 id="fields" className={h2}>The {DISCLOSURE_FIELDS.length} questions, and the duty each one serves</h2>
            <p className="mt-3">
              Each answer is Yes, No or Not disclosed. Not disclosed is an honest answer. It becomes a question to ask the
              vendor. The last column names the matching item in the Illinois ARDC GAI Terms of Use Checklist.
            </p>
            <table className="mt-5 block md:table w-full text-sm text-left">
              <thead className="hidden md:table-header-group border-b border-slate-300 text-navy font-sans">
                <tr className="md:table-row">
                  <th scope="col" className="px-3 py-2">The vendor says whether it</th>
                  <th scope="col" className="px-3 py-2">Duty it serves</th>
                  <th scope="col" className="px-3 py-2">Illinois checklist</th>
                </tr>
              </thead>
              <tbody className="block md:table-row-group">
                {DISCLOSURE_FIELDS.map((f) => (
                  <tr key={f.id} className="block md:table-row rounded-lg border border-slate-200 md:border-0 md:border-b p-4 md:p-0 mb-4 md:mb-0">
                    <th scope="row" data-label="Question" className={`${cell} font-sans font-semibold text-navy text-left`}>
                      {f.label}
                      {f.detailLabel && <span className="block font-body font-normal text-charcoal/75">With a yes: {f.detailLabel.toLowerCase()}</span>}
                    </th>
                    <td data-label="Duty it serves" className={cell}>{f.duties.map((d) => DUTIES[d].label).join('; ')}</td>
                    <td data-label="Illinois checklist" className={cell}>{f.illinois.length ? f.illinois.map((i) => ILLINOIS_ITEMS[i]).join('; ') : 'None'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section aria-labelledby="duties">
            <h2 id="duties" className={h2}>What each duty asks of you</h2>
            <dl className="mt-4 space-y-5">
              {Object.values(DUTIES).map((d) => (
                <div key={d.id}>
                  <dt className="font-sans font-semibold text-navy">{d.label}</dt>
                  <dd className="mt-1">{d.summary}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm">
              State bars say much the same. Florida Bar Ethics Opinion 24-1 recommends a client&apos;s informed consent before
              confidential information goes into a third-party AI program. California&apos;s practical guidance says reasonable
              efforts take more than relying on marketing claims. Your state may differ.
            </p>
          </section>

          <section aria-labelledby="example">
            <h2 id="example" className={h2}>What a label looks like</h2>
            <p className="mt-3 mb-5">
              Example Vendor, Inc. is made up. So are its answers and its links. It shows how a label reads, including three
              answers the vendor did not disclose.
            </p>
            <AiDisclosureLabel disclosure={EXAMPLE_DISCLOSURE} headingLevel={3} />
          </section>

          <section aria-labelledby="memo">
            <h2 id="memo" className={h2}>Free diligence memo for your file</h2>
            <p className="mt-3">
              Pick a tool with a published disclosure and get a one-page memo you can print or save as a PDF. It lists each
              answer, its source, the duty it bears on, and the questions to send the vendor for anything not disclosed.
            </p>
            <p className="mt-3">
              <Link href="/ai-disclosure/memo" className="font-sans font-semibold text-gold-text hover:underline">Build a diligence memo →</Link>
            </p>
          </section>

          <section aria-labelledby="publish">
            <h2 id="publish" className={h2}>How a vendor publishes one (free)</h2>
            <ol className="list-decimal pl-6 mt-3 space-y-2">
              <li>Answer each of the {DISCLOSURE_FIELDS.length} questions with Yes, No or Not disclosed.</li>
              <li>For each Yes or No, give the page and the section where you say it in public.</li>
              <li>
                Email the answers to <a href={PUBLISH_MAILTO} className={link}>hello@legalaimcp.com</a>. Your listing must
                already be in the directory. If it is not, <Link href="/submit" className={link}>submit your tool</Link> first.
              </li>
              <li>We post it on your listing marked Self-reported. You can send an update at any time.</li>
            </ol>
            <p className="mt-3">We do not check self-reported answers. The label says so in plain words.</p>
          </section>

          <section aria-labelledby="reviewed" className="rounded-2xl border border-gold/40 bg-gold/5 p-8">
            <h2 id="reviewed" className={h2}>Reviewed AI Disclosure</h2>
            <p className="font-display text-4xl font-bold text-navy mt-3">
              {PRICE}
              <span className="text-lg font-sans font-medium text-charcoal/80 ml-2">/ year</span>
            </p>
            <ul className="mt-4 space-y-2">
              <li>We check every answer against your own terms, privacy policy and trust page.</li>
              <li>We cite the section each answer comes from.</li>
              <li>We check again every {REVIEW_INTERVAL_DAYS} days.</li>
              <li>The label shows Reviewed and the review date.</li>
            </ul>
            <p className="mt-4 text-sm">
              We never change an answer for pay. If your terms say yes, the label says yes. Trust center software, where a
              vendor posts its security papers, often costs thousands of dollars a year. This is one standard page with a
              fixed price.
            </p>
            <a href={REVIEWED_MAILTO} className="btn-primary inline-flex mt-6">Ask about a review</a>
            <p className="mt-3 text-xs text-charcoal/75">This sends us an email. Nothing is charged until we agree the scope in writing.</p>
          </section>

          <section aria-labelledby="not">
            <h2 id="not" className={h2}>What this is not</h2>
            <p className="mt-3">
              LegalAIMCP is not a law firm and this is not legal advice. A label does not say a tool is safe or right for your
              firm, and it does not test the tool&apos;s security. It tells you what the vendor says in public, and, for a
              Reviewed label, that we found it there. Check your own state&apos;s rules before you rely on it.
            </p>
          </section>

          <section aria-labelledby="sources">
            <h2 id="sources" className={h2}>Sources</h2>
            <p className="mt-3 text-sm">Read on {SOURCES_READ_ON}.</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
              {DISCLOSURE_SOURCES.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className={link}>{s.label}</a>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="faq">
            <h2 id="faq" className={h2}>Questions</h2>
            <dl className="mt-4 space-y-5">
              {AI_DISCLOSURE_FAQS.map((f) => (
                <div key={f.q}>
                  <dt className="font-sans font-semibold text-navy">{f.q}</dt>
                  <dd className="mt-1">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </main>
  )
}

export const metadata: Metadata = withSocial(baseMetadata)
