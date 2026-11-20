# Quality gates are mechanical, and they ratchet

Conventions this project cares about are enforced by a check that fails the build, not by
prose or review. Where a codebase-wide number is involved (coverage, bundle size, mutation
score, comment count), the gate is a **ratchet**: a floor or ceiling set just past today's
value, tightened deliberately as things improve, so a regression fails the PR but one honest
change doesn't trip a spurious failure.

## Decisions

- **Architectural fitness functions** (`src/architecture.test.ts`) turn the conventions in
  `CLAUDE.md` into tests that name the offending file. A structural rule that is only a cheap
  canary (R5: middleware still mentions `/admin`) is paired with a behavioural test
  (`src/middleware.test.ts`) that is the real authorization gate.
- **Coverage floor** (`vitest.config.ts`): thresholds sit a couple of points below the
  measured baseline and are raised as coverage grows. Only `src/**/*.ts` is measured: `.astro`
  components are covered by the build and the type check, not by Vitest.
- **Client bundle budgets** (`scripts/check-bundle-budget.mjs`): Astro's value is shipping
  little client JS, so compiled client bundles have per-chunk and aggregate budgets, set a
  little above current size. Raising one is a visible, deliberate edit. Any chunk without its
  own line must stay under a default ceiling, so a new heavy chunk forces a budget entry.
  reveal.js has its own line because it only loads on `/posts/*/present`, and must not mask
  regressions in app-wide chunks. Rolldown (Astro 7) splits the analytics page's geo-chart
  dependencies into their own `build.js` chunk, so that chunk has a line too.
- **Tripwire constants in tests**: a test that pins a cache key or TTL hardcodes the value
  instead of importing it from the module under test, so changing it fails a test and must be
  acknowledged rather than propagating silently.
- **Property-based tests** subject functions to a wide space of random stressor inputs and
  assert the invariants that must survive every input. They run with a fixed seed
  (`vitest.setup.ts`) so failures are reproducible and CI is deterministic.
- **Type checking** uses TypeScript 7.1 `tsc` with `@astrojs/ts-content-mapper` (registered in
  `tsconfig.json`) instead of `astro check`, which cannot run on TypeScript 7.
  `scripts/typecheck.mjs` first runs `astro sync` so content collections are typed, then drops
  diagnostics from `node_modules`: Astro's own components do not pass our strict config.
- The complexity gate (`cccc.toml`) and the comment ratchet (ADR-0003) follow the same rules.
