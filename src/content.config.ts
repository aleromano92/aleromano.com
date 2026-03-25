import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { LANGUAGES } from './types/i18n';

const supportedLanguages = Object.keys(LANGUAGES);

const blogCollection = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/blog',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
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
    originalLink: z.string().optional(),
  })
});

const presentationsCollection = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/presentations',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    blogPostSlug: z.string(),
    language: z.enum(supportedLanguages as [string, ...string[]]),
    theme: z.string().optional(),
    transition: z.string().optional(),
  })
});

export const collections = {
  'blog': blogCollection,
  'presentations': presentationsCollection
}; 