import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { getAllPosts } from '@/lib/blog'
import { SITE_URL } from '@/lib/constants'
import { CATEGORY_CONTENT } from '@/lib/category-content'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = supabase
    ? (
        await supabase
          .from('listings')
          .select('slug, updated_at')
          .eq('status', 'published')
      ).data
    : null

  const categories = supabase
    ? (await supabase.from('categories').select('slug')).data
    : null

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    {
      url: `${SITE_URL}/servers`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      // High priority deliberately: this is the install page for our own MCP
      // server, and it's the canonical URL every MCP registry listing points
      // back to. It's the site's only first-party tool, not a marketing page.
      url: `${SITE_URL}/mcp`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/submit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      // Flagship editorial roundup — the SEO format gap fix per the
      // 2026-08-07 audit (BOF listicle pages competitors were winning with).
      url: `${SITE_URL}/best/legal-mcp-servers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/guides/connect-claude-to-courtlistener`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  const bestCategoryPages: MetadataRoute.Sitemap = Object.keys(CATEGORY_CONTENT).map((slug) => ({
    url: `${SITE_URL}/best/${slug}-mcp-servers`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }))

  const listingPages: MetadataRoute.Sitemap = (listings || []).map(
    (l: { slug: string; updated_at: string }) => ({
      url: `${SITE_URL}/servers/${l.slug}`,
      lastModified: new Date(l.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }),
  )

  const categoryPages: MetadataRoute.Sitemap = (categories || []).map(
    (c: { slug: string }) => ({
      url: `${SITE_URL}/categories/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }),
  )

  const blogPages: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...bestCategoryPages, ...categoryPages, ...listingPages, ...blogPages]
}
