import { defineCollection, z } from 'astro:content';
import { LANGUAGES } from '../types/i18n';

const supportedLanguages = Object.keys(LANGUAGES);

const blogCollection = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    author: z.string(),
    image: z.object({
      url: image(),
      alt: z.string()
    }).optional(),
    tags: z.array(z.string()),
    language: z.enum(supportedLanguages as [string, ...string[]]),
    originalLink: z.string().optional(), // For posts that link to external content in other languages
  })
});

export const collections = {
  'blog': blogCollection
}; 