import { sql } from '@/lib/db'
import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thehyyu.com'

const CATEGORIES = ['work', 'technology', 'life', 'sadhaka']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await sql`
    SELECT slug, updated_at
    FROM posts
    WHERE status = 'published'
    ORDER BY updated_at DESC
  `

  const postEntries: MetadataRoute.Sitemap = posts.flatMap((post) => [
    {
      url: `${BASE_URL}/zh/posts/${post.slug}`,
      lastModified: new Date(post.updated_at as string),
      alternates: {
        languages: {
          'zh-TW': `${BASE_URL}/zh/posts/${post.slug}`,
          'en': `${BASE_URL}/en/posts/${post.slug}`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/posts/${post.slug}`,
      lastModified: new Date(post.updated_at as string),
      alternates: {
        languages: {
          'zh-TW': `${BASE_URL}/zh/posts/${post.slug}`,
          'en': `${BASE_URL}/en/posts/${post.slug}`,
        },
      },
    },
  ])

  const categoryEntries: MetadataRoute.Sitemap = CATEGORIES.flatMap((slug) => [
    { url: `${BASE_URL}/zh/category/${slug}` },
    { url: `${BASE_URL}/en/category/${slug}` },
  ])

  return [
    {
      url: `${BASE_URL}/zh`,
      alternates: { languages: { 'zh-TW': `${BASE_URL}/zh`, 'en': `${BASE_URL}/en` } },
    },
    {
      url: `${BASE_URL}/en`,
      alternates: { languages: { 'zh-TW': `${BASE_URL}/zh`, 'en': `${BASE_URL}/en` } },
    },
    { url: `${BASE_URL}/zh/search` },
    { url: `${BASE_URL}/en/search` },
    ...categoryEntries,
    ...postEntries,
  ]
}
