import { fitTitle, fitDescription, FILLER } from '@/lib/seo-meta'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPostBySlug, getAllSlugs } from '@/lib/blog'
import { SITE_URL } from '@/lib/constants'
import { LeadGenCTA } from '../../components/LeadGenCTA'
import { FAQJsonLd } from '../../components/JsonLd'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: 'Post Not Found' }

  return {
    // Claude Sonnet 5.5, 2026-11-12: fit title <= 60 and description >= 110 chars (Ahrefs 11/12)
    title: fitTitle(post.title),
    description: fitDescription(post.description, FILLER.post),
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.updatedDate ?? post.date,
    },
  }
}

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  // Content is from our own lib/blog.ts — trusted, not user-generated
  const articleHtml = { __html: post.content }

  return (
    <main className="section-padding">
      <div className="max-w-content mx-auto">
        {/* Breadcrumb */}
        <nav className="text-sm font-body text-charcoal/80 mb-8">
          <Link href="/blog" className="hover:text-gold-text transition-colors">
            Blog
          </Link>
          <span className="mx-2">/</span>
          <span>{post.title}</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs bg-slate-100 text-charcoal rounded-full px-2.5 py-1 font-sans">
              {post.category}
            </span>
            <span className="text-xs text-charcoal/75 font-body">
              {new Date(post.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className="text-xs text-charcoal/75 font-body">{post.readingTime}</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-navy leading-tight">
            {post.title}
          </h1>
          <p className="font-body text-lg text-charcoal/75 mt-3">{post.description}</p>
          <p className="font-body text-sm text-charcoal/75 mt-4">By {post.author}</p>
          {post.updatedDate && <p className="font-body text-sm text-charcoal/75 mt-2">Sources and wording reviewed <time dateTime={post.updatedDate}>{post.updatedDate}</time></p>}
        </div>

        {/* Article content — safe: sourced from our own lib/blog.ts, not user input */}
        {/* baseline:15 renders checked-in HTML from lib/blog.ts only; no CMS or user path reaches this sink */}
        <article
          className="prose prose-slate prose-headings:font-display prose-headings:text-navy prose-a:text-gold-text prose-a:no-underline hover:prose-a:underline prose-strong:text-navy max-w-none font-body"
          dangerouslySetInnerHTML={articleHtml}
        />

        {/* Claude Sonnet 5.5, 2026-11-12: optional FAQ; the same strings feed the visible text and the FAQPage schema. */}
        {post.faqs && post.faqs.length > 0 && (
          <section className="mt-12">
            <FAQJsonLd faqs={post.faqs} />
            <h2 className="font-display text-2xl font-bold text-navy mb-5">Common questions</h2>
            <ul className="space-y-3">
              {post.faqs.map(({ q, a }) => (
                <li key={q}>
                  <details className="group rounded-xl border border-slate-200 bg-white open:bg-warm-white open:border-navy/20 transition-colors">
                    <summary className="cursor-pointer list-none px-5 py-4 font-display text-lg font-semibold text-navy flex items-center justify-between gap-4">
                      <span>{q}</span>
                      <span aria-hidden="true" className="text-2xl text-gold-text group-open:rotate-45 transition-transform leading-none">+</span>
                    </summary>
                    <div className="px-5 pb-5 font-body text-charcoal/80 leading-relaxed">{a}</div>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA */}
        <div className="mt-16">
          <LeadGenCTA />
        </div>
      </div>
    </main>
  )
}
