'use client'

import { Printer } from 'lucide-react'

// Trivial client wrapper for window.print(). Lives in its own file so the
// /checklist page can stay a server component (better TTFB, SEO, and prerender
// behavior for the rest of the lead-magnet content).
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="mt-6 inline-flex items-center gap-2 text-sm font-sans font-semibold text-navy hover:text-gold-text print:hidden"
    >
      <Printer className="w-4 h-4" strokeWidth={2} />
      Print or save as PDF
    </button>
  )
}
