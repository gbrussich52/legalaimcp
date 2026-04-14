import Link from 'next/link'
import {
  FileText,
  Briefcase,
  MessageSquare,
  Search,
  Clock,
  Shield,
  Sparkles,
  Folder,
  type LucideIcon,
} from 'lucide-react'
import type { Category } from '@/lib/types'

// Static icon map — only imports the icons actually used by categories
const ICON_MAP: Record<string, LucideIcon> = {
  FileText,
  Briefcase,
  MessageSquare,
  Search,
  Clock,
  Shield,
  Sparkles,
  Folder,
}

export function CategoryCard({ category, count }: { category: Category; count: number }) {
  const IconComponent = ICON_MAP[category.icon] ?? Folder

  return (
    <Link href={`/categories/${category.slug}`} className="card group block text-center">
      <div className="h-12 w-12 rounded-xl bg-slate-50 group-hover:bg-amber-50 flex items-center justify-center mx-auto mb-3 transition-colors">
        <IconComponent className="w-6 h-6 text-navy group-hover:text-gold-text" strokeWidth={1.5} />
      </div>
      <p className="font-sans font-semibold text-navy text-sm">{category.name}</p>
      <p className="text-xs text-charcoal/50 mt-0.5">{count} tools</p>
    </Link>
  )
}
