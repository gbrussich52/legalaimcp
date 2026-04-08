import Link from 'next/link'
import * as Icons from 'lucide-react'
import type { Category } from '@/lib/types'

export function CategoryCard({ category, count }: { category: Category; count: number }) {
  // Resolve icon by name from lucide-react; fall back to Folder if not found
  const IconComponent = (Icons as Record<string, unknown>)[category.icon] as React.ComponentType<{
    className?: string
    strokeWidth?: number
  }> | undefined ?? Icons.Folder

  return (
    <Link href={`/categories/${category.slug}`} className="card group block text-center">
      {/* Icon container */}
      <div className="h-12 w-12 rounded-xl bg-slate-50 group-hover:bg-amber-50 flex items-center justify-center mx-auto mb-3 transition-colors">
        <IconComponent className="w-6 h-6 text-navy group-hover:text-gold-text" strokeWidth={1.5} />
      </div>

      {/* Name */}
      <p className="font-sans font-semibold text-navy text-sm">{category.name}</p>

      {/* Count */}
      <p className="text-xs text-charcoal/50 mt-0.5">{count} tools</p>
    </Link>
  )
}
