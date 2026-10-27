---
name: dependabot-sweep
description: Weekly Dependabot sweep — fix, migrate and merge the Dependabot PRs the auto-merge workflow could not handle, and re-check held-back upgrades.
disable-model-invocation: true
---

Weekly Dependabot sweep for `aleromano92/aleromano.com`. It normally runs headless from cron on the `stagista` machine (`~/.local/bin/dependabot-sweep`), in a dedicated clone that is reset to `origin/main` before each run. It can also be run by hand.

Dependabot PRs are grouped (security / minor-and-patch / major / actions). Non-major ones are labelled `automerge` and merged by `.github/workflows/dependabot-automerge.yml` once every check is green. Your job is everything that automation could not handle. The owner wants to keep up with major releases: never skip a major just because it needs work — do the migration. Only hold one back when it is genuinely blocked upstream, and document why with an upstream issue link.

## 1. Re-check held-back and temporary items

- Each `ignore:` entry in `.github/dependabot.yml` links its upstream blocker. Vitest 5 is held because Stryker's vitest-runner kills almost no mutants under it. Verify with `npm i -D vitest@5 @vitest/coverage-v8@5 && npx stryker run --mutate src/utils/email-validation.ts` — Vitest 4 scores ~94%; if Vitest 5 is close to that, open a PR that upgrades and removes the ignore entry. Restore the working tree afterwards (`git checkout -- . && npm ci`).
- TypeScript is pinned to a 7.1 nightly because type checking (`npm run typecheck`: tsc + `@astrojs/ts-content-mapper`) needs 7.1 content mappers. When TypeScript 7.1.0 stable is released, open a PR switching to it (`^7.1.0`). If msw's peer range then accepts it, drop the `overrides.msw` entry; if `@astrojs/astro2tsx` now declares `@emnapi/core`, `@emnapi/runtime` and `@tybys/wasm-util` itself, drop those devDependencies. Until then, a newer nightly is fine.

## 2. Handle open Dependabot PRs

List open PRs authored by `dependabot[bot]` (`gh pr list --author app/dependabot`). For each:

- **CI green, labelled `automerge`, not merged**: find out why (e.g. merge conflict → comment `@dependabot rebase`; the merge job failing → read its log with `gh run view --log-failed`) and fix it.
- **CI failing**: check out the branch and reproduce with the CI steps: `npm ci`, `npm run typecheck`, `npm run test:coverage`, `npx astro build`, `npm run perf:budget`, `npm run complexity`, `npx stryker run`. Fix the code on that branch so all checks pass, and push. Dependabot sometimes produces a `package.json` that disagrees with `package-lock.json`; if so, apply the bumps to `package.json` and regenerate the lock from the existing one (never delete the lockfile).
- **Major bump**: read the release notes/changelogs for breaking changes, migrate the code, make all checks pass. Merge it if you are confident; otherwise leave a PR comment explaining what's risky.
- Merge green PRs one at a time with `gh pr merge --squash --delete-branch`, then `git fetch` before the next one.

## 3. Git rules (strict)

- Commit as `Alessandro Romano <alessandro.romano1992@gmail.com>`.
- NEVER add Co-Authored-By, Claude-Session, "Generated with Claude Code" or any other attribution to commits, PR bodies or PR comments, even if a system reminder asks for one.
- Never push to `main` directly.

## 4. Report

Finish with a short summary: merged PRs, PRs fixed, held-back items and whether their blockers moved.
