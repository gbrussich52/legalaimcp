import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { getAllPosts } from '@/lib/blog'
import { SITE_URL } from '@/lib/constants'
import { CATEGORY_CONTENT } from '@/lib/category-content'

/**
 * Real last-commit dates for the hand-written and template-generated routes.
 *
 * Deliberately NOT `new Date()`: sitemap.ts is evaluated per request, so a bare
 * `new Date()` claimed these pages changed seconds ago on every fetch. lastmod
 * tells Google what is worth re-crawling; one that always says "everything just
 * changed" carries no information, and Google's documented response to
 * unreliable lastmod is to ignore the field for the whole site — which would
 * also throw away the *accurate* dates the listing and blog entries below
 * already derive from `updated_at` / post front-matter.
 *
 * Bump a date when that page's content meaningfully changes.
 */
const MODIFIED = {
  home: '2026-07-28',
  servers: '2026-08-07',
  mcp: '2026-07-28',
  submit: '2026-06-10',
  about: '2026-07-28',
  blogIndex: '2026-04-13',
  bestLegal: '2026-08-07',
  courtlistenerGuide: '2026-08-07',
  harveyGuide: '2026-08-10',
  bestCategoryTemplate: '2026-08-07',
  categoryIndex: '2026-07-28',
} as const

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
    { url: SITE_URL, lastModified: MODIFIED.home, changeFrequency: 'weekly', priority: 1 },
    {
      url: `${SITE_URL}/servers`,
      lastModified: MODIFIED.servers,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      // High priority deliberately: this is the install page for our own MCP
      // server, and it's the canonical URL every MCP registry listing points
      // back to. It's the site's only first-party tool, not a marketing page.
      url: `${SITE_URL}/mcp`,
      lastModified: MODIFIED.mcp,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/submit`,
      lastModified: MODIFIED.submit,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: MODIFIED.about,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: MODIFIED.blogIndex,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      // Flagship editorial roundup — the SEO format gap fix per the
      // 2026-08-07 audit (BOF listicle pages competitors were winning with).
      url: `${SITE_URL}/best/legal-mcp-servers`,
      lastModified: MODIFIED.bestLegal,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/guides/connect-claude-to-courtlistener`,
      lastModified: MODIFIED.courtlistenerGuide,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      // Harvey is the site's highest-impression query cluster in Search Console
      // (harvey mcp + harvey ai mcp + harvey ai) with no guide behind it until
      // now — see docs/seo/gsc-query-gap-2026-08-10.md in the portfolio repo.
      url: `${SITE_URL}/guides/connect-claude-to-harvey`,
      lastModified: MODIFIED.harveyGuide,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  const bestCategoryPages: MetadataRoute.Sitemap = Object.keys(CATEGORY_CONTENT).map((slug) => ({
    url: `${SITE_URL}/best/${slug}-mcp-servers`,
    lastModified: MODIFIED.bestCategoryTemplate,
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
      lastModified: MODIFIED.categoryIndex,
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
