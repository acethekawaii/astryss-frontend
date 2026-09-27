import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',       // applies to all crawlers
      allow: '/',           // allow everything
      disallow: '/private/' // block private routes (if any)
    },
    sitemap: 'https://astryss.acethekawaii.com/sitemap.xml',
  }
}