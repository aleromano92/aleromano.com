import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import rehypeExternalLinks from 'rehype-external-links';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Enable MSW for server-side mocking in development
if (import.meta.env.DEV || process.env.NODE_ENV === 'development') {
  await import('./src/mocks/node.ts');
}

// https://astro.build/config
export default defineConfig({
  output: 'server',

  adapter: node({
    mode: 'standalone'
  }),

  integrations: [sitemap({
    i18n: {
      defaultLocale: 'en',
      locales: {
        en: 'en',
        it: 'it',
      }
    },
    // Custom filter to exclude API routes
    filter: (page) => !page.includes('/api/'),
    changefreq: 'weekly',
    priority: 0.7,
    serialize(item) {
      const pathname = new URL(item.url).pathname;
      const match = pathname.match(/^\/posts\/(?:(it)\/)?(.+)$/);
      if (match) {
        const lang = match[1] ?? 'en';
        const slug = match[2].replace(/\/$/, '');
        const filePath = join(process.cwd(), 'src/content/blog', lang, `${slug}.md`);
        if (existsSync(filePath)) {
          const raw = readFileSync(filePath, 'utf-8');
          const pubDateMatch = raw.match(/^pubDate:\s*(.+)$/m);
          if (pubDateMatch) {
            return { ...item, lastmod: new Date(pubDateMatch[1].trim()) };
          }
        }
      }
      return item;
    },
  })],

  markdown: {
    shikiConfig: {
      theme: 'night-owl',
      langs: [
        'typescript',
        'javascript',
        'jsx',
        'json',
        'bash',
        'sh',
        'diff',
        'plaintext'
      ],
      wrap: true
    },
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }]
    ]
  },

  site: 'https://aleromano.com',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'it'],
    routing: {
      prefixDefaultLocale: false,
      strategy: 'prefix-other-locales'
    },
    fallback: {
      it: 'en'
    }
  }
});