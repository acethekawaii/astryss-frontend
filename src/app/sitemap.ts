import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://astryss.acethekawaii.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://astryss.acethekawaii.com/release',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: 'https://astryss.acethekawaii.com/entries',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },  
    {
      url: 'https://astryss.acethekawaii.com/unsent',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: 'https://astryss.acethekawaii.com/time-capsule',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://astryss.acethekawaii.com/faqs',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}