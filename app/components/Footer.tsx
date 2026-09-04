import Link from 'next/link'
import { SITE_NAME, NYCLAW_URL, NYCLAW_CONTACT } from '@/lib/constants'

const MAIN_CATEGORIES = [
  { slug: 'document-processing', label: 'Document Processing' },
  { slug: 'case-management', label: 'Case Management' },
  { slug: 'legal-research', label: 'Legal Research' },
  { slug: 'client-communication', label: 'Client Communication' },
]

const RESOURCES = [
  { href: '/servers', label: 'Browse All Tools' },
  { href: '/submit', label: 'Submit a Tool' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-navy text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* 4-column grid */}
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          {/* Col 1: Brand */}
          <div>
            <p className="font-display text-xl font-bold">{SITE_NAME}</p>
            <p className="text-slate-400 text-sm font-body mt-2">
              The curated directory of AI-powered integrations for law firms.
            </p>
          </div>

          {/* Col 2: Categories */}
          <div>
            <p className="font-sans font-semibold text-sm uppercase tracking-wider text-slate-300 mb-3">
              Categories
            </p>
            <ul className="space-y-2">
              {MAIN_CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/categories/${cat.slug}`}
                    className="text-slate-400 text-sm font-body hover:text-white transition-colors"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Resources */}
          <div>
            <p className="font-sans font-semibold text-sm uppercase tracking-wider text-slate-300 mb-3">
              Resources
            </p>
            <ul className="space-y-2">
              {RESOURCES.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 text-sm font-body hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Built by */}
          <div>
            <p className="font-sans font-semibold text-sm uppercase tracking-wider text-slate-300 mb-3">
              Built by
            </p>
            <Link
              href={NYCLAW_URL}
              className="text-gold-display font-sans font-semibold hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              NYClaw.io
            </Link>
            <p className="text-slate-400 text-sm font-body mt-2">
              AI implementation for law firms in Westchester County, NY and beyond.
            </p>
            <Link
              href={NYCLAW_CONTACT}
              className="text-slate-400 text-sm font-body hover:text-white transition-colors mt-2 inline-block"
            >
              Get a consultation →
            </Link>
          </div>
        </div>

        {/* Not-legal-advice notice.

            This site publishes ethics-rule summaries (ABA Model Rules 1.1
            cmt. 8 and 1.6 appear in the blog) and a bar-compliance checklist,
            aimed squarely at practicing attorneys — while being operated by
            engineers, not lawyers. Summarizing publicly available rules is
            legal *information*, which non-lawyer publishers do routinely and
            legitimately; it is not legal advice and not UPL. But saying so
            out loud is what keeps the distinction clear to a reader, and the
            site spent ~3.5 months implying attorney curation it never had.
            Stating the limitation plainly costs nothing and is the cheapest
            possible insurance against being read as something we're not. */}
        <p className="text-slate-500 text-xs font-body border-t border-slate-700 pt-8 mb-6 leading-relaxed">
          {SITE_NAME} is operated by engineers, not attorneys. Everything here —
          listings, checklists, and articles summarizing bar rules — is
          information about software, not legal advice, and does not create an
          attorney-client relationship. Confirm any ethics or compliance
          question against your own state bar&apos;s rules and opinions before
          you rely on it.
        </p>

        {/* Divider + bottom row */}
        <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <p className="text-slate-400 text-sm font-body">
            © {currentYear} {SITE_NAME}. All rights reserved.
          </p>
          {/* Funding disclosure, owned upfront rather than buried — CRO rule
              #11 trust cluster. Previously read "Funded by affiliate
              revenue," which described plumbing that was never built: no
              affiliate network, no referral params on any outbound link.
              Claiming revenue you don't earn is a worse disclosure than
              none. Update this the day an affiliate link actually ships. */}
          <p className="text-slate-400 text-xs font-body">
            Funded by NYClaw.io.{' '}
            <span className="text-slate-500">
              Featured placements are labeled; no affiliate links.
            </span>
          </p>
        </div>
      </div>
    </footer>
  )
}
