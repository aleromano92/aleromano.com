import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import rehypeExternalLinks from 'rehype-external-links';

// https://astro.build/config
export default defineConfig({
  output: 'server',

  adapter: node({
    mode: 'standalone'
  }),

  integrations: [],

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