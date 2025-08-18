# GitHub Copilot Instructions for aleromano.com

## Development Workflow & Principles

- **Always ask clarifying questions** before implementing if uncertain about requirements
- **Write down your thought process** and reasoning before coding
- **Proceed step by step** instead of making many changes simultaneously
- **Favor readability** over clever code snippets - apply Clean Code principles
- **Use descriptive variable names** and follow Astro's naming conventions
- **Include 3-5 lines of context** when making file edits for clarity

## Architecture Overview

This is a bilingual (English/Italian) personal blog built with **Astro 5** using:
- **SSR mode** with Node.js adapter for Docker deployment
- **Content Collections** for blog posts with strict TypeScript schemas
- **Custom i18n routing** with URL path prefixing (`/it/` for Italian, no prefix for English)
- **Docker-based deployment** to a Hetzner VPS with nginx reverse proxy

## Essential Commands

```bash
# Development
npm run dev                    # Start dev server (localhost:4321)
npm run build                  # Build with TypeScript checking
npm test                       # Run all Vitest tests
npm run test:watch            # Test watch mode

# Docker workflows
npm run docker:dev            # Full dev stack with nginx

# Content operations
npx astro check               # TypeScript validation for .astro files
```

## Critical Patterns

### i18n URL Structure
- **English (default)**: `/blog`, `/posts/my-post`, `/about`
- **Italian**: `/it/blog`, `/posts/it/my-post`, `/it/about`
- **Blog posts** use different pattern: `/posts/{lang}/slug` vs `/posts/slug`

Use `getLocalizedPathname()` and `getLanguageFromURL()` from `src/utils/i18n.ts` for URL transformations.

### Content Collections Schema
Blog posts require specific frontmatter in `src/content/blog/{lang}/post-name.md`:
```yaml
---
title: "Post Title"
description: "SEO description"
pubDate: 2024-01-01
author: "Alessandro Romano"
tags: ["tag1", "tag2"]
language: "en" # or "it"
image:
  url: "./featured.jpg"
  alt: "Image description"
---
```

### Static Page Prerendering
For pages that should be static (not SSR), add to `.astro` files:
```typescript
export const prerender = true;
```

### Component Patterns
- **Navigation**: Uses `isNavigationItemActive()` for active state detection
- **Theme switching**: CSS custom properties in `src/styles/theme.css`
- **Blog routing**: `[...slug].astro` handles both languages using `findPostBySlug()`

## Code Style & Quality

- **TypeScript**: Use strict typing (extends Astro's strict config)
- **CSS**: Reuse variables from `src/styles/theme.css`; use rem units for sizes/spacing
- **Accessibility**: Ensure proper semantic HTML and ARIA attributes
- **Imports**: Group imports by type (framework, components, utils)
- **Components**: Create `.astro` files in `src/components/`; use PascalCase naming
- **Tests**: Place test files next to code with `.test.ts` suffix; use Vitest

## Docker Deployment Context

The site runs in **server mode** with Docker multi-stage builds:
- Node.js adapter generates `dist/server/entry.mjs` for container runtime
- nginx proxy handles SSL termination and static assets

## Testing Approach

- **Vitest** for unit tests, placed next to source files (`.test.ts`)
- Use `vi.stubGlobal()` for browser API mocking (localStorage, navigator)

## Key Files for Context

- `astro.config.mjs` - Core configuration with i18n routing
- `src/content/config.ts` - Content collection schemas
- `src/utils/i18n.ts` - All internationalization logic
- `src/utils/posts.ts` - Blog post URL generation and parsing
- `src/pages/[...slug].astro` - Dynamic blog post routing

## Observability

Includes VPS monitoring daemon (`scripts/observability/`) that:
- Monitors Docker containers and logs
- Checks website availability
- Sends Telegram alerts for issues
- Runs as systemd service on the VPS
