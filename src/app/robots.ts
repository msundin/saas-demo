import { MetadataRoute } from 'next'

/**
 * SEO Protection: Dynamic robots.txt
 *
 * Controls search engine indexing based on environment variable.
 * Prevents demo/template sites from appearing in search results.
 *
 * Configuration:
 * - NEXT_PUBLIC_ROBOTS=noindex → Block all search engines
 * - NEXT_PUBLIC_ROBOTS=index (or unset) → Allow indexing
 *
 * Example:
 * - demo.infswsol.com: NEXT_PUBLIC_ROBOTS=noindex
 * - template.infswsol.com: NEXT_PUBLIC_ROBOTS=noindex
 * - app1.novatratech.com: No NEXT_PUBLIC_ROBOTS (allow indexing)
 */
export default function robots(): MetadataRoute.Robots {
  const allowIndexing = process.env.NEXT_PUBLIC_ROBOTS !== 'noindex'

  if (!allowIndexing) {
    // Block all search engines from indexing
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  // Allow indexing and provide sitemap
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://example.com'}/sitemap.xml`,
  }
}
