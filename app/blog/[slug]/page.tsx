import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPostBySlug, getAllSlugs } from '@/lib/blog'
import { SITE_URL } from '@/lib/constants'
import { LeadGenCTA } from '../../components/LeadGenCTA'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: 'Post Not Found' }

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
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
        <nav className="text-sm font-body text-charcoal/50 mb-8">
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
            <span className="text-xs text-charcoal/40 font-body">
              {new Date(post.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className="text-xs text-charcoal/40 font-body">{post.readingTime}</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-navy leading-tight">
            {post.title}
          </h1>
          <p className="font-body text-lg text-charcoal/60 mt-3">{post.description}</p>
          <p className="font-body text-sm text-charcoal/40 mt-4">By {post.author}</p>
        </div>

        {/* Article content — safe: sourced from our own lib/blog.ts, not user input */}
        <article
          className="prose prose-slate prose-headings:font-display prose-headings:text-navy prose-a:text-gold-text prose-a:no-underline hover:prose-a:underline prose-strong:text-navy max-w-none font-body"
          dangerouslySetInnerHTML={articleHtml}
        />

        {/* CTA */}
        <div className="mt-16">
          <LeadGenCTA />
        </div>
      </div>
    </main>
  )
}
