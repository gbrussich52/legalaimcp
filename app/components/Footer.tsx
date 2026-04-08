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

        {/* Divider + bottom row */}
        <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <p className="text-slate-400 text-sm font-body">
            © {currentYear} {SITE_NAME}. All rights reserved.
          </p>
          <p className="text-slate-500 text-xs font-body">
            Some links may earn us a commission at no extra cost to you.
          </p>
        </div>
      </div>
    </footer>
  )
}
