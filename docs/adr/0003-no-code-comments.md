# No comments in code

Comments drift from the code they describe, and they let a hacky implementation pass review
because it comes with an apology attached. So code carries no comments. Intent goes in names,
types and tests. Decisions go in an ADR, and workarounds go in a GitHub issue.

## Decisions

- **Every comment is one of four things, and each has a home:**
  - A **tautology** (restates the code) or **stale** comment (describes code that changed or
    is gone) is deleted.
  - An **excuse** (justifies a hack, "good enough for now") is deleted, and the hack becomes
    a GitHub issue.
  - A **decision record** (an important, non-obvious why) moves into an ADR in `docs/adr/`.
  The `/delete-comment` skill runs this process.
- **Enforced by a ratchet**, not a hard ban: `npm run lint:comments` (CI, `deploy.yml`)
  counts comments per file and compares them with `scripts/lint-comments/baseline.json`. A
  file may not gain comments, and files missing from the baseline must have none. When a file
  loses comments, the build also fails until `npm run lint:comments -- --update` locks in the
  lower count, so the baseline can only go down. Renaming a file that still has comments
  counts as a new file: clean it first.
- **Scope**: TypeScript/JavaScript, `.astro` (frontmatter, scripts, markup and styles), CSS
  and `tsconfig*.json` are parsed properly. Shell, YAML, nginx, Dockerfile and TOML count
  full-line `#` comments only. Blog content (`src/content/`), `public/` and vendored agent
  skills are out of scope.
- **Directives are not comments**: hashbangs, `/// <reference>`, `@ts-expect-error` (and the
  other `@ts-` pragmas), `@vite-ignore` and `@__PURE__` stay.

## Consequences

- The first sweep removed every comment in the application and tooling code. The baseline
  still holds the infrastructure files (CI workflows, nginx, Docker, VPS scripts) for a later
  `/delete-comment` run.
- Trailing `# comment`s in the hash-comment languages are not counted.
