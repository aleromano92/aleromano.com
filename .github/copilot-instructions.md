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

## Feature Request Template

Use this template when requesting new features for the aleromano.com website:

### 1. Feature Overview
**Problem Statement**: What problem does this feature solve?
**User Goal**: What should users be able to do after this feature is implemented?
**Business Value**: Why is this feature important for the website's goals?

### 2. User Story
**As a** [type of user]
**I want** [specific functionality]
**So that** [desired outcome/benefit]

### 3. Technical Context
**Affected Systems**: Which parts of the architecture will be involved? (SSR pages, content collections, i18n, Docker, etc.)
**Integration Points**: How does this feature interact with existing code?
**Constraints**: Any technical limitations or requirements (no SaaS, build from scratch, performance, etc.)
**Architecture Dependencies**: Which existing utils, components, or patterns should be leveraged?

### 4. Acceptance Criteria
**Core Functionality**:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

**Technical Requirements**:
- [ ] TypeScript strict typing
- [ ] Responsive design (mobile/desktop)
- [ ] Light/dark theme support
- [ ] i18n support (English/Italian)
- [ ] Accessibility compliance

**Quality Gates**:
- [ ] Business logic has automated tests
- [ ] Error handling implemented
- [ ] Performance considerations addressed

### 5. Implementation Approach
**Preferred Method**: Incremental/step-by-step development
**Phase Breakdown**: List the logical phases for implementation
**Validation Points**: Where should I pause for your approval?
**Technical Design**: Upfront discussion of architecture, data flow, and key decisions

### 6. Testing Strategy
**Business Logic**: What core functionality needs automated testing?
**Integration Points**: How should interactions between systems be validated?
**Manual Testing**: What manual verification steps are needed?

### 7. Examples & References
**Similar Features**: Point to existing code that demonstrates similar patterns
**External Inspiration**: Links to websites/libraries that show the desired behavior
**Design Mockups**: Any visual references or wireframes

### 8. Change Impact Assessment
**Files to Modify**: List of expected files that will be created/changed
**Breaking Changes**: Any potential impacts on existing functionality
**Documentation Updates**: What needs to be documented or updated

### 9. Questions for Clarification
**Technical Decisions**: Any upfront architectural choices to discuss
**Scope Boundaries**: What's explicitly included/excluded from this feature
**Future Considerations**: How might this feature evolve or connect to future work

---

**Example Usage:**
```
## Feature: Add RSS feed for newsletter subscribers

### 1. Feature Overview
**Problem Statement**: Readers want to subscribe to new blog posts via RSS but the current feed doesn't include enough metadata for newsletter services.
**User Goal**: Subscribe to a rich RSS feed that includes full post content and proper categorization.
**Business Value**: Increases subscriber retention and makes content more discoverable.

### 2. User Story
**As a** blog reader
**I want** to subscribe to an RSS feed with full post content
**So that** I can read new posts in my preferred RSS reader without visiting the website

[Continue with remaining sections...]
```
