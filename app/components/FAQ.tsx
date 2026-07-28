import Link from 'next/link'
import { NYCLAW_URL } from '@/lib/constants'

// Objection preemption per CRO rule #14. The five questions below are the
// top objections an attorney has BEFORE they trust a "directory of AI tools"
// run by a third party. Answering them up-front converts skeptical traffic
// into engaged readers; not answering them sends that traffic back to search.
//
// Each answer is intentionally short (grade-6 reading level, rule #19) and
// honest. If we can't answer "yes" to a hard question, we say so and explain
// the trade-off — that's more credible than spin.

const FAQ_ITEMS = [
  {
    q: 'Are these AI tools actually vetted?',
    a: (
      <>
        Partly — and it&apos;s worth knowing exactly how far it goes. Listings are
        compiled and reviewed by{' '}
        <Link href={NYCLAW_URL} className="text-gold-text font-semibold hover:underline" target="_blank" rel="noopener noreferrer">
          NYClaw.io
        </Link>
        , an AI implementation agency. We confirm the tool exists, the maker is
        real, and the link resolves — and we re-check every published link
        automatically, so dead tools get pulled instead of quietly rotting.
        What we don&apos;t do is legal or bar-compliance review. We&apos;re engineers,
        not attorneys. Our free checklist walks you through that side yourself.
      </>
    ),
  },
  {
    q: 'Is my client data safe with MCP tools?',
    a: (
      <>
        It depends on the tool — and that&apos;s the question this directory exists
        to answer. Each listing notes whether the tool processes data locally,
        sends it to a third-party model, or supports BYOK (bring-your-own-key).
        Our free checklist walks you through the exact data-privacy questions
        to ask every vendor before you sign.
      </>
    ),
  },
  {
    q: 'How is this directory funded? Are listings paid?',
    a: (
      <>
        No tool pays to appear, and right now the directory earns nothing at
        all — there are no affiliate links and no sponsorships. It&apos;s funded by{' '}
        <Link href={NYCLAW_URL} className="text-gold-text font-semibold hover:underline" target="_blank" rel="noopener noreferrer">
          NYClaw.io
        </Link>
        , the AI agency that builds it, because we work in this space and
        needed the map ourselves. If that ever changes, we&apos;ll label the paid
        or affiliate links on the listing itself — not just in the footer.
      </>
    ),
  },
  {
    q: 'I run a solo practice — is this overkill for me?',
    a: (
      <>
        No. Most of the highest-leverage AI tools for law firms are *more*
        useful for solos than for BigLaw, because you have less paralegal
        support to absorb the grunt work. We filter for solo-friendly pricing
        (most picks have Free or Freemium tiers) and we mark which tools
        require a tech team to install.
      </>
    ),
  },
  {
    q: 'What if I need something custom, not off-the-shelf?',
    a: (
      <>
        Talk to{' '}
        <Link href={NYCLAW_URL} className="text-gold-text font-semibold hover:underline" target="_blank" rel="noopener noreferrer">
          NYClaw.io
        </Link>
        . That&apos;s the AI agency that builds and funds this directory — they
        build private AI integrations for firms whose workflow doesn&apos;t match
        any off-the-shelf tool. (Disclosure: NYClaw funds this site.)
      </>
    ),
  },
] as const

export function FAQ() {
  return (
    <section className="section-padding bg-warm-white">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-10">
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-2">
            Common Questions
          </p>
          <h2 className="font-display text-3xl font-bold text-navy">
            Before you trust us with your tool research
          </h2>
        </div>

        <ul className="space-y-3">
          {FAQ_ITEMS.map(({ q, a }) => (
            <li key={q}>
              {/* <details> gives us collapsible behavior with zero JS and
                  reasonable a11y by default — better than a custom accordion
                  for a content-heavy page where some users will skim, some
                  will read every word. */}
              <details className="group rounded-xl border border-slate-200 bg-white open:bg-warm-white open:border-navy/20 transition-colors">
                <summary className="cursor-pointer list-none px-5 py-4 font-display text-lg font-semibold text-navy flex items-center justify-between gap-4">
                  <span>{q}</span>
                  <span
                    aria-hidden="true"
                    className="text-2xl text-gold-text group-open:rotate-45 transition-transform leading-none"
                  >
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 font-body text-charcoal/80 leading-relaxed">
                  {a}
                </div>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
