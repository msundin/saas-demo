import { MetadataRoute } from 'next'

/**
 * SEO Protection: Dynamic robots.txt
 *
 * Controls search engine indexing based on environment variable.
 * Prevents demo/template sites from appearing in search results.
 *
 * Three-Tier Deployment Strategy:
 * 1. saas-demo (cloud deployment validation + customer demos)
 *    - demo.infswsol.com: NEXT_PUBLIC_ROBOTS=noindex
 *    - Supabase Cloud + Vercel Free
 *    - Always-available for demos
 *
 * 2. saas-template (optional remote testing)
 *    - saas-template.infswsol.com: NEXT_PUBLIC_ROBOTS=noindex (optional deployment)
 *    - TrueNAS Supabase + Vercel Free
 *    - Recommendation: Keep local-only, no deployment needed
 *
 * 3. Production apps (real SaaS products)
 *    - app1.novatratech.com: No NEXT_PUBLIC_ROBOTS (allow indexing)
 *    - Bootstrap: TrueNAS Supabase + Vercel Free ($0/month)
 *    - Production: Supabase Cloud + Vercel Pro ($45/month when successful)
 *
 * Configuration:
 * - NEXT_PUBLIC_ROBOTS=noindex → Block all search engines (demo/template)
 * - NEXT_PUBLIC_ROBOTS=index (or unset) → Allow indexing (production apps)
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
