import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import rehypeExternalLinks from 'rehype-external-links';

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
    lastmod: new Date(),
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