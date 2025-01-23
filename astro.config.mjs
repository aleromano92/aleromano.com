import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

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
    }
  },

  site: 'https://aleromano.com',  // Replace with your actual domain

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