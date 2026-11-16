import type { Metadata } from 'next'

// Claude Sonnet 5.5, 2026-11-16: the login page is a client component, so it cannot export metadata itself.
// It had no canonical and was indexable; the scan of the built pages flagged it. Keep it out of search.
export const metadata: Metadata = { title: 'Admin login', robots: { index: false, follow: false } }

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
