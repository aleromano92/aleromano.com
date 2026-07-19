# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build, Lint & Test Commands
- **Development**: `npm run dev`
- **Build**: `npm run build` (runs TypeScript check + Astro build)
- **TypeScript Check**: `npx astro check`
- **Test All**: `npm test`
- **Test Single File**: `npx vitest run src/path/to/file.test.ts`
- **Test Watch Mode**: `npm run test:watch`
- **Docker Dev**: `npm run docker:dev`
- **Deploy**: `npm run deploy` (builds Docker image on remote Hetzner VPS via SSH)
- **Observability local testing**: `npm run docker:dev:obs` 

## Architecture

**Astro 6 SSR** app deployed as a standalone Node.js server inside Docker on Hetzner VPS, behind nginx. Output mode is `server` (not static), so there is no static pre-rendering by default — add `export const prerender = true` only for pages that genuinely don't need server execution.

**Runtime entry point**: `node --import=./observability/otel/node-register.mjs ./dist/server/entry.mjs` — OpenTelemetry is auto-instrumented at startup.

### Enforced architecture rules

Several conventions below are not just guidance — they are **mechanically enforced** by architectural fitness functions in [`src/architecture.test.ts`](src/architecture.test.ts), which fail the build (and CI) on violation. That test is the source of truth for the exact rule; the prose here explains the intent. Currently enforced:

- Components must not import from `pages/` (pages depend on components, not the reverse).
- `better-sqlite3` may only be imported inside `src/utils/database/` (the DB driver stays encapsulated behind the connection pool / cache layer).
- `src/utils/` is a leaf layer — it must not import from `components/` or `pages/`.
- Every Italian page under `src/pages/it/` delegates to a `Base*` shell from `src/components/pages/`.
- `src/middleware.ts` guards the `/admin` route prefix — a structural canary in `architecture.test.ts` plus behavioural auth tests in [`src/middleware.test.ts`](src/middleware.test.ts) (401 without/with-wrong credentials, fails closed when unconfigured).

When you change one of these intentionally, update the test first — it's the gate.

### i18n Routing
Configured with `prefixDefaultLocale: false` and `strategy: prefix-other-locales`:
- English (default): `/blog`, `/posts/my-post`, `/about`
- Italian: `/it/blog`, `/it/posts/my-post`, `/it/about`

Content collection IDs follow `{lang}/slug` format (e.g. `en/my-post`, `it/my-post`). When building `getStaticPaths()` for blog posts, the ID must be split to extract language and slug separately for correct URL generation. Italian pages live under `src/pages/it/` and delegate to `Base*` components from `src/components/pages/` (enforced — see *Enforced architecture rules*).

### Content Collections
Blog posts in `src/content/blog/{en|it}/` and presentations in `src/content/presentations/`. Schema defined with Zod in `src/content.config.ts`. Presentations are linked to blog posts via `blogPostSlug` and rendered with reveal.js at `/posts/[slug]/present`.

### Database
SQLite via `better-sqlite3` with a connection pool in `src/utils/database/connection.ts` (driver import is confined to `src/utils/database/` — enforced). Used for:
- **Caching**: API responses (Twitter feed, GitHub commits) with configurable TTL — 36 hours for Twitter
- **Analytics**: Custom hit tracking with IP geolocation via `geolite2-redist`

In tests, the DB is replaced with an in-memory instance via `vitest.setup.ts`.

### Testing
Vitest with MSW (Mock Service Worker) for HTTP interception. `vitest.setup.ts` starts the MSW server and configures an in-memory SQLite DB before tests run. Handlers reset between tests. Test files live next to the code they test with a `.test.ts` suffix.

### Admin Routes
`src/middleware.ts` protects `/admin/*` with HTTP Basic Auth using timing-safe comparison (the `/admin` guard is enforced). Credentials come from `ADMIN_USER` / `ADMIN_PASS` env vars.

## Code Style
- **TypeScript**: Strict mode (extends `astro/tsconfigs/strict`)
- **CSS**: Use variables from `src/styles/theme.css`; rem units for sizes/spacing
- **Components**: PascalCase `.astro` files; page-level reusable shells go in `src/components/pages/`
- **i18n**: Use utilities in `src/utils/i18n.ts`; types in `src/types/i18n.ts` (`SupportedLanguage`, `LocalizedContent<T>`)
- **Imports**: Group by type (framework → components → utils)

## Agent skills

### Issue tracker

Issues are tracked on GitHub (`aleromano92/aleromano.com`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage labels are used as-is (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
