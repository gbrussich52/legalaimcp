import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { CATEGORY_CONTENT } from '@/lib/category-content'

// Claude Fable 5.2, 2026-11-15: the editorial "focus" sections moved here from
// app/categories/[slug]/page.tsx so /best/{category}-mcp-servers can show them too. Firecrawl asked
// for its government index on the compliance roundup; it is a legal research listing, so it appears
// as a cross-category pointer, not as a compliance tool. Names and taglines still come from the
// published rows, so neither page can describe a tool the directory does not publish.
type FocusRow = { slug: string; name: string; tagline: string }

export async function CategoryFocusSections({ categorySlug, className }: { categorySlug: string; className: string }) {
  const focus = CATEGORY_CONTENT[categorySlug]?.focus ?? []
  const slugs = [...new Set(focus.flatMap((f) => f.slugs))]
  if (!supabase || slugs.length === 0) return null
  const { data } = await supabase.from('listings').select('slug, name, tagline').eq('status', 'published').in('slug', slugs)
  const bySlug = new Map(((data ?? []) as FocusRow[]).map((r) => [r.slug, r]))
  return (
    <>
      {focus.map((f) => {
        const rows = f.slugs.map((s) => bySlug.get(s)).filter(Boolean) as FocusRow[]
        if (rows.length === 0) return null
        return (
          <section key={f.heading} className={className}>
            <h2 className="font-display text-2xl font-bold text-navy mb-3">{f.heading}</h2>
            <p className="font-body text-charcoal/80 leading-relaxed mb-4">{f.lead}</p>
            <ul className="space-y-3">
              {rows.map((r) => (
                <li key={r.slug} className="font-body text-charcoal/80 leading-relaxed">
                  <Link href={`/servers/${r.slug}`} className="text-gold-text font-semibold hover:underline">
                    {r.name}
                  </Link>
                  {': '}
                  {r.tagline}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}
