---
title: "Making My Codebase Agent-Ready"
description: "AI writes 99% of the code on this site — though I still read all of it, to learn and stay sharp. But I've made my review focus on what actually matters instead of being a kind of human QA. I introduced deterministic gates that let an AI agent change my code without me losing sleep: CI, coverage, mutation testing, architectural fitness functions, performance budgets, and property-based testing. Along the way, I also found some real bugs."
pubDate: 2026-06-24
author: "Alessandro Romano"
tags: ["AI", "aleromano.com", "Best Practices", "DevOps", "Software Engineering"]
language: "en"
---

A while ago I wrote about [making my site easily digestible](/posts/agent-ready) by the agents that browse the web: markdown endpoints, `llms.txt`, structured data.

This time I focused on my own Developer eXperience — letting me (or rather, letting an agent) write more code without introducing regressions. I started from a question:

> What stops a tireless, fast, plausible-sounding contributor with zero accountability from quietly breaking things?

The answer turned out to be the same thing that makes [trunk-based development](https://trunkbaseddevelopment.com/) work for humans: a scaffolding of **deterministic gates**. This is the story of building that scaffolding — and of the very real bugs that surfaced along the way.

## The Incident That Started It 🧨

It began with the most boring task imaginable: a Dependabot PR bumping `nodemailer` from 8 to 9. I asked the agent to check it out, run the tests, and verify the contact form still sent email.

It did. But while poking around it noticed two things.

First, one test was **failing** — a cache TTL assertion expecting one hour while the code said ten minutes. Someone (me) had changed the source months earlier and never updated the test.

Second, and far worse: **that failing test had never failed CI.** My pipeline only built a Docker image and deployed it. There was no `npm test` step anywhere, and no `pull_request` trigger. The tests existed. They simply never ran. A broken assertion had been sitting green for who knows how long.

So: I had tests, but I did not have **gates**. And if I could not trust my own safety net, I certainly could not hand an autonomous agent the keys.

So I set off on a little journey.

## Step 0: Make the Tests Actually Run ✅

The unglamorous foundation. I added a `checks` job to the workflow that runs the type checker and the full test suite on every push **and every pull request**, and made build-and-deploy depend on it.

Honestly, I was convinced I had wired the tests into CI since day 0 😅. I know the value of a fast, reliable battery of unit tests, so I have always written them — even for this personal project. It's just that if I didn't run them by hand, they didn't run. FIXED!

## Step 1: Coverage — Necessary, Not Sufficient 📏

Next I added a coverage gate, set up as a **ratchet**: the threshold sits a couple of points below the current number, so any change that *drops* coverage fails the build, and as coverage climbs I raise the baseline.

What does coverage actually do? **It measures execution, not verification.** A line can be 100% covered and 0% checked, if your test runs it but never asserts anything about the result. Coverage tells you the code *ran*. It cannot tell you the test was *working*.

Coverage is necessary — you cannot verify code you never execute — but treating it as a quality target is how you get [Goodhart's law](https://en.wikipedia.org/wiki/Goodhart%27s_law) and a codebase full of assertion-free tests that exist purely to make a number go up. In fact I consider it a "dangerous" metric: the moment it becomes a target, it can be gamed and turn *misleading* (I still remember "colleagues" testing getters and setters in the Java world…).

In the agentic world, though, it has its use: steering the AI toward output that is tested by design, instead of writing code that will get tests later (or, more likely, NEVER).

## Step 2: Mutation Testing — Testing the Tests 🧬

[Mutation testing](https://en.wikipedia.org/wiki/Mutation_testing) attacks your code to see whether your tests are any good. It introduces small faults into the source — flips a `>` to `>=`, turns `if (x)` into `if (true)`, deletes a line — and re-runs your suite against each mutated version (a *mutant*).

- If a test **fails** on the mutant, the mutant is "killed" — your tests would have caught that bug. Good.
- If every test still **passes**, the mutant **survived** — you have code whose breakage no test would notice. A hole, quantified.

The idea comes from a 1978 paper by DeMillo, Lipton and Sayward, and it answers the exact question coverage cannot: *"if this code were wrong, would anything go red?"*

I pointed [Stryker](https://stryker-mutator.io/) at my `utils` folder. The headline:

> One file had **75% line coverage but a 46% mutation score.** Over half of its logic could be silently broken and not a single test would complain.

It even pinpointed the kind of bug that hides behind green coverage. In `github.ts` I have a fallback that, if the GitHub API is unreachable, serves a cached copy even when it is stale. Stryker mutated that branch's condition and the mutant **survived**:

```text
[Survived] ConditionalExpression
src/utils/github.ts:209:11
-       if (staleCached) {
+       if (true) {
```

My "handles API errors gracefully" test passed anyway: it checked that the endpoint returned a clean error, but not that it *wasn't* serving stale data when there was none. With `if (true)` the branch was always taken, and nobody noticed. One line of assertion was enough to kill the mutant — **without adding a single covered line**:

```ts
// in the "should handle API errors gracefully" test
expect(mockConsoleWarn).not.toHaveBeenCalledWith(expect.stringContaining('stale'));
```

That is the whole lesson in one diff: strength is not coverage.

## Step 3: Architectural Fitness Functions — Rules an Agent Cannot Break 🏛️

Up to here I was testing *behaviour*. But a lot of what keeps a codebase healthy is **structure**: the database driver stays behind its module, components do not import pages, the Italian routes reuse the shared shells. That knowledge lived in my `CLAUDE.md` as prose.

Borrowing from [*Building Evolutionary Architecture*](https://www.thoughtworks.com/en-us/insights/books/building-evolutionary-architectures), I turned those rules into **fitness functions**: plain tests that scan the codebase and fail the build on violation. A handful of them:

- Components must not import from `pages/`.
- `better-sqlite3` may only be imported inside `utils/database/`.
- Every Italian page must delegate to a `Base*` shell.
- The middleware must guard `/admin`.

The punchline for agentic development: **an agent cannot violate a rule that is mechanically enforced.** A guideline in a doc is a suggestion it might ignore. A fitness function is a fence it cannot walk through. I did not even delete the prose — I *demoted* it: the doc now explains the *why* (guidance for whoever is writing the code), and the test owns the *what* (the verdict). Document the intent; enforce the rule.

## Step 4: Performance Budgets — A Fitness Function for Speed ⚡

Same shape, different goal. The point of this site being Astro is that it ships almost no JavaScript. Nothing stopped an agent (or me) from importing some heavy library into a component and quietly undoing that.

So I added a [bundle-size budget](https://github.com/aleromano92/aleromano.com/blob/main/scripts/check-bundle-budget.mjs): a script that runs after the build and fails if the client JavaScript grows past its limit. The fiddly bit was that my biggest bundle by far is the reveal.js presentation runtime (~1.1 MB), which only loads on `/present` routes. A naive "total JS" budget would just be measuring reveal.js and would happily wave through a regression in the code that runs on every page. So I isolated it on its own budget line and put a separate, tighter ceiling on the app-wide JavaScript.

One deliberate **non-choice** here, which matters: I did *not* make Lighthouse or load tests into gates. More on why in a second.

## Step 5: Property-Based Testing & Residuality — Stressing the Whole Space 🎲

Every test so far checks **points**: for input X, expect output Y. You pick X, so you only ever check the cases you imagined. The bug lives in the case you didn't.

[Property-based testing](https://github.com/dubzzz/fast-check) inverts this. Instead of "for this input, this output," you state an **invariant that must hold for every input**, and the tool generates hundreds of random inputs trying to break it, then *shrinks* any failure to the minimal case:

- For *any* string, reading-time returns a whole number ≥ 1 and never `NaN`.
- For *any* referer, normalizing it twice equals normalizing it once.
- For *any* JSON body, the contact endpoint returns a sane status and never crashes.

This connects to [residuality theory](https://www.sciencedirect.com/science/article/pii/S1877050920305585) (Barry O'Reilly): a system is best understood by its **residues** — what survives after you hit it with **stressors**. You design for resilience by enumerating the stressors and making sure a coping residue exists for each. Random inputs, dependency failures, hostile payloads: an autonomous agent is itself a stressor generator, so the right question stops being "did I test what I imagined?" and becomes "what is the universe of stressors, and does a residue survive each?"

It paid off within minutes. A generated stressor produced:

```js
normalizeReferer("git:foo") // → "null"  (the literal string!)
```

`URL.origin` returns the *string* `"null"` for non-`http(s)` schemes, and my analytics was storing that as a referer. No example test would ever have tried `git:foo`. The idempotence property found it, shrank it to four characters, and I fixed it by restricting to real http(s) referers.

## Why "Deterministic" Is the Whole Point 🎯

A pattern runs through all of this, and it is the reason I keep saying *gate* and not *test*.

A gate returns a binary, **reproducible** verdict and is allowed to block the merge. That bar is higher than "a test that runs," and determinism is non-negotiable for three reasons:

1. **A flaky gate gets disabled.** The first time a check goes red for reasons unrelated to your change, humans learn to rerun until green. A non-deterministic gate is *worse* than no gate, because it trains everyone to ignore red.
2. **It replaces slow human judgement.** This is the trunk-based development link: continuous integration is only safe because a fast, trustworthy gate stands in for the long review queue.
3. **It is the agent's feedback signal.** An agent has no taste, no fear, and no memory of the last outage. You have to externalise judgement into mechanical fences — and a fence is only useful if it is in the same place every time.

This is exactly why I refused to gate on Lighthouse or load tests. Their scores wobble on shared CI runners. They are fantastic **monitors** — noisy, observational, trend-watching — but a **gate** must be deterministic. Same data, different job. Confusing the two gives you either flaky pipelines or unguarded regressions.

And the randomized tests? I pinned the seed. Property-based testing is random in *method* but deterministic in *verdict*: a failure is always reproducible. The exploration is a feature; the flakiness is not.

## What I Actually Got 🧩

Putting all the steps together:

- Example tests check **chosen behaviour**.
- Coverage checks **whether I looked**.
- Mutation testing checks **whether my looking is sharp**.
- Architectural fitness functions check **the shape of the system**.
- Performance budgets check **its cost**.
- Property-based testing checks **the whole input space, under stress**.

Having laid these foundations, I feel far more confident about the next step: building *loops* where different signals can spin up new work on my site for an AI that then produces far more code than I could ever review in my limited time. With these gates in place, I feel safe merging — and sleeping soundly.
