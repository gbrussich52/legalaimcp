import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Legal AI Blog',
  description:
    'Articles about AI for law firms — tool reviews, implementation guides, and industry insights from LegalAIMCP.',
  alternates: { canonical: 'https://legalaimcp.com/blog' },
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <main className="section-padding">
      <div className="max-w-content mx-auto">
        <h1 className="font-display text-4xl font-bold text-navy">
          Legal AI Blog
        </h1>
        <p className="font-body text-lg text-charcoal/70 mt-3">
          Insights, guides, and tool reviews for law firms navigating AI.
        </p>

        <div className="mt-12 space-y-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block card-bordered group hover:border-navy/20 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
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
              <h2 className="font-display text-xl font-bold text-navy group-hover:text-gold-text transition-colors">
                {post.title}
              </h2>
              <p className="font-body text-charcoal/60 mt-2 leading-relaxed">
                {post.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
