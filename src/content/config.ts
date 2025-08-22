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

const presentationsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    blogPostSlug: z.string(), // Links to the corresponding blog post
    language: z.enum(supportedLanguages as [string, ...string[]]),
    theme: z.string().optional(), // Optional reveal.js theme override
    transition: z.string().optional(), // Optional reveal.js transition override
  })
});

export const collections = {
  'blog': blogCollection,
  'presentations': presentationsCollection
}; 