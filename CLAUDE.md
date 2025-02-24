# CLAUDE.md - Guidance for Agentic Coding Assistants

## Build, Lint & Test Commands
- **Development**: `npm run dev` or `npm start`
- **Build**: `npm run build` (includes TypeScript checking)
- **TypeScript Check**: `npx astro check`
- **Test All**: `npm test`
- **Test Single File**: `npx vitest run src/path/to/file.test.ts`
- **Test Watch Mode**: `npm run test:watch`
- **Docker Dev**: `npm run docker:dev`
- **Deploy**: `npm run deploy` (builds on remote Hetzner server)

## Code Style Guidelines
- **TypeScript**: Use strict typing (extends Astro's strict config)
- **Components**: Create `.astro` files in src/components/
- **Naming**: Use descriptive variable names; PascalCase for components
- **CSS**: Reuse variables from theme.css; use rem units for sizes/spacing
- **Accessibility**: Ensure proper semantic HTML and ARIA attributes
- **Imports**: Group imports by type (framework, components, utils)
- **i18n**: Support English (default) and Italian; use i18n utilities for translations
- **Static Pages**: Add `export const prerender = true` for pages that should be prerendered
- **Tests**: Place test files next to the code they test with `.test.ts` suffix

## File Organization
- **Pages**: Use Astro's file-based routing in `src/pages/`
- **Dynamic Routes**: Use `[...slug].astro` syntax and implement proper patterns
- **Content**: Use Markdown (.md) files with frontmatter for content-heavy pages