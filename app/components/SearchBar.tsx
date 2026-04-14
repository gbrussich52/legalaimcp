'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useCallback } from 'react'
import { Search } from 'lucide-react'

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value

      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
          params.set('q', value)
        } else {
          params.delete('q')
        }
        router.push(`/servers?${params.toString()}`)
      }, 300)
    },
    [router, searchParams],
  )

  return (
    <div className="relative w-full">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="search"
        defaultValue={searchParams.get('q') ?? ''}
        onChange={handleChange}
        placeholder="Search legal AI tools..."
        className="pl-10 pr-4 py-3 w-full border-2 border-slate-200 rounded-lg text-sm font-body focus:border-gold-text focus:outline-none"
        aria-label="Search listings"
      />
    </div>
  )
}
