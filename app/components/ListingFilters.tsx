'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { CATEGORY_LABELS, PRICING_LABELS } from '@/lib/constants'

export function ListingFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentCategory = searchParams.get('category') ?? ''
  const currentPricing = searchParams.get('pricing') ?? ''

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Preserve other params (q, etc.)
    router.push(`/servers?${params.toString()}`)
  }

  return (
    <div className="flex gap-3">
      {/* Category filter */}
      <select
        value={currentCategory}
        onChange={(e) => updateParam('category', e.target.value)}
        className="border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm font-sans bg-white focus:border-gold-text focus:outline-none"
        aria-label="Filter by category"
      >
        <option value="">All Categories</option>
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {/* Pricing filter */}
      <select
        value={currentPricing}
        onChange={(e) => updateParam('pricing', e.target.value)}
        className="border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm font-sans bg-white focus:border-gold-text focus:outline-none"
        aria-label="Filter by pricing"
      >
        <option value="">All Pricing</option>
        {Object.entries(PRICING_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default ListingFilters
