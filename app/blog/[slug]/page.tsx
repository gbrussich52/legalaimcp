import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

// Future: fetch blog posts from Supabase or MDX files
export async function generateStaticParams() {
  return [] // No blog posts yet
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return { title: slug } // Placeholder
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug: _slug } = await params
  // No posts exist yet — all slugs 404
  notFound()
}
