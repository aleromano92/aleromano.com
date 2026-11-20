---
name: delete-comment
description: Sweep code comments — categorise each one, delete it, move decisions into ADRs, file issues for excused hacks, and tighten the comment ratchet.
disable-model-invocation: true
argument-hint: "[pathspec …] (default: the whole codebase)"
---

Code in this repo carries no comments (ADR `docs/adr/0003-no-code-comments.md`). Legacy comments are tracked by a ratchet in `scripts/lint-comments/baseline.json`. This skill sweeps a scope clean and locks in the progress.

## 1. Inventory

Run `npm run -s lint:comments -- --list $ARGUMENTS`. The arguments are git pathspecs (`src/utils`, `nginx`, `'*.yml'`); with none, the whole codebase is listed. Directives (hashbangs, `/// <reference>`, `@ts-*`, `@vite-ignore`, `@__PURE__`) are already excluded.

Also read the titles of `docs/adr/*.md` and the glossary in `CONTEXT.md`, so you know where decisions already live and which domain words to use.

Done when you hold the full list.

## 2. Categorise

Open each file and read every comment with the code around it. A run of consecutive line comments is one comment. Give each exactly one category:

- **Tautology**: restates what the code, its names, types or tests already say. Examples: section banners, "Get translations for the current language", JSDoc that repeats the signature, `// 10 minutes` beside `10 * 60 * 1000`.
- **Stale**: describes something that has changed or no longer exists. Check it against the code: wrong names, old versions or numbers, "this was the bug", usage snippets that no longer match.
- **Excuse**: justifies a hack or defers a decision. Examples: "good enough", "for now", "somehow", "known quirk", "hardcoded from…", "for compatibility", "could drop them instead", or prose that justifies a type cast or a duplicated constant.
- **Decision record**: an important, non-obvious *why*, such as a trade-off, a constraint the code cannot show, or a deliberate deviation someone would otherwise "fix".

Tautology or decision record? Ask whether a competent reader of the code, its names and its tests would reconstruct the why. If they would, it is a tautology.

Done when every comment from step 1 has a category.

## 3. Act

- **Tautology, Stale**: delete. If the deletion leaves a magic value unclear, make the code say it (`5 * 60_000`, a named constant), never a new comment.
- **Excuse**: delete, and file one GitHub issue per hack (`docs/agents/issue-tracker.md`, label `needs-triage`). Group comments that excuse the same hack into one issue. The body covers where (file and symbol, not line numbers), the deleted comment quoted, what the hack is, why it matters, and a suggested direction.
- **Decision record**: move it into `docs/adr/`. If an ADR already records the decision, just delete the comment. If it refines an existing ADR's area, add a bullet there. Otherwise create the next-numbered ADR in the house format (see `docs/adr/0001-*.md`), with one ADR per theme, not one per comment.

Delete whole comment lines. Leave no double blank lines and no blank line right after an opening brace.

Done when the scope's `--list` output is empty.

## 4. Ratchet and gates

Run `npm run lint:comments -- --update`, then `npm run typecheck`, `npm test`, `npm run complexity` and `npm run lint:comments`. Done when all of them pass.

## 5. Report

Report:

- a count per category;
- every issue filed, with links;
- every ADR created or extended;
- lines shed (`git diff --shortstat`);
- the comments left in the baseline, with an estimate of the lines a full sweep would still shed.
