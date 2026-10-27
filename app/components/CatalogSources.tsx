import { getCatalogEvidence } from '@/lib/catalog-evidence'
import type { ListingDetailData } from '@/lib/types'

export function CatalogSources({ listing }: { listing: ListingDetailData }) {
  const evidence = getCatalogEvidence({ ...listing })
  if (!evidence) return null
  return <section className="mb-10 border-l-4 border-gold bg-amber-50/60 p-5" aria-labelledby="source-review-heading">
    <h2 id="source-review-heading" className="font-sans font-semibold text-navy">Primary sources reviewed <time dateTime={evidence.reviewed_at}>{evidence.reviewed_at}</time></h2>
    <p className="font-body text-sm text-charcoal/80 mt-2">We checked this product’s identity and the published description against these vendor or maintainer sources. Customer-account operation, security and legal-output accuracy have not been independently tested.</p>
    <ul className="font-body text-sm mt-3 space-y-2">
      {evidence.source_urls.map((url,index) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer" className="text-gold-text underline break-words">Source {index+1}: {new URL(url).hostname} ↗</a></li>)}
    </ul>
  </section>
}
