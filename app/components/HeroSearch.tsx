'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'

export function HeroSearch() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = inputRef.current?.value.trim()
    if (q) {
      router.push(`/servers?q=${encodeURIComponent(q)}`)
    } else {
      router.push('/servers')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto mt-8">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        placeholder="Search tools — e.g. contract review, intake, billing..."
        className="w-full pl-12 pr-32 py-4 rounded-xl text-charcoal text-sm font-body bg-white border-2 border-transparent focus:border-gold-text focus:outline-none shadow-lg"
        aria-label="Search legal AI tools"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-navy text-white text-sm font-sans font-semibold px-5 py-2 rounded-lg hover:bg-slate-800 transition-colors"
      >
        Search
      </button>
    </form>
  )
}
