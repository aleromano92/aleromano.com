# AI Discoverability Plan

Based on:
- https://morello.dev/blog/configuring-my-site-for-ai-discoverability
- https://isitagentready.com (audit results)

This site is deployed on Hetzner VPS (not Cloudflare), so the Cloudflare-specific
sections (_headers file, wrangler.jsonc, cache config) are skipped entirely.
Everything below maps to the Astro SSR architecture already in place.

---

## 1. Markdown Mirroring

**What:** Serve the raw markdown source of every blog post at a parallel `.md` URL.

- `/posts/my-post` → HTML (existing)
- `/posts/my-post.md` → raw markdown, `Content-Type: text/markdown; charset=utf-8`
- `/posts/it/my-post.md` → same for Italian posts

**How:**
Create `src/pages/posts/[...slug].md.ts` (a GET endpoint) alongside the existing
`src/pages/posts/[...slug]/index.astro`. It uses the same `getStaticPaths()` logic
to resolve the collection entry by slug, then returns `post.body` (the raw markdown
source available on every collection entry) with the correct Content-Type header.

**Files to create:**
- `src/pages/posts/[...slug].md.ts` — new GET endpoint, `prerender = true`

---

## 2. Link Tag Advertisement

**What:** Add a `<link rel="alternate" type="text/markdown" href="...">` in the
`<head>` of every blog post page so agents can discover the markdown URL without
parsing HTML.

**How:**
In `src/layouts/BlogPostLayout.astro`, compute the `.md` URL from the current post
slug and inject the link tag into the `<head>` block.

**Files to edit:**
- `src/layouts/BlogPostLayout.astro`

---

## 3. Link Response Headers (RFC 8288)

**What:** Advertise key resources via HTTP `Link` response headers on every page,
so agents discover them without parsing HTML at all. Per RFC 8288 and RFC 9727.

Headers to add on all responses:
```
Link: </llms.txt>; rel="alternate"; type="text/plain"
Link: </llms-full.txt>; rel="alternate"; type="text/plain"
Link: </rss.xml>; rel="alternate"; type="application/rss+xml"; title="RSS"
Link: </sitemap-index.xml>; rel="sitemap"
```

On blog post pages additionally:
```
Link: </posts/my-post.md>; rel="alternate"; type="text/markdown"
```

**How:**
Extend the existing `src/middleware.ts` (already used for Basic Auth on `/admin`).
The middleware intercepts the response from `next()` and appends `Link` headers.
For post pages, detect the URL pattern `/posts/...` (excluding `/api/`, `.md`, etc.)
and compute the corresponding `.md` URL.

Note: these are response headers, not `<link>` tags — they work at the HTTP layer
and are visible to any HTTP client, not just HTML parsers.

**Files to edit:**
- `src/middleware.ts`

---

## 4. LLM Index Files

**What:** Two files at the site root:

- `/llms.txt` — index listing every English post with title, description, and `.md` URL
- `/llms-full.txt` — the full concatenated raw markdown of every English post

**Format for `llms.txt`:**
```
# Alessandro Romano's Blog

> Personal site covering SRE, backend engineering, and web development.

## Posts

- [Post Title](/posts/my-post.md): Short description.
...
```

**Format for `llms-full.txt`:**
Concatenation of each post's markdown, separated by `---` dividers with a header
per post (title + URL).

**Scope:** English posts only (Italian are translations; duplicate content not useful
for AI corpora). Posts sorted newest-first.

**Files to create:**
- `src/pages/llms.txt.ts` — GET endpoint, `prerender = true`
- `src/pages/llms-full.txt.ts` — GET endpoint, `prerender = true`

---

## 5. robots.txt — Add AI Content Signals

**What:** Extend the existing robots.txt with a Content-Signal directive:

```
# AI content signals
Content-Signal: search=yes, ai-train=no, ai-input=yes
```

`ai-input=yes` — AI agents may use content as context (RAG, Q&A, etc.).
`ai-train=no` — content must not be used for model training datasets.
`search=yes` — standard indexing for search is permitted.

Spec: https://contentsignals.org/

**Files to edit:**
- `src/pages/robots.txt.js`

---

## 6. Agent Skills Discovery Index

**What:** Publish a machine-readable index at `/.well-known/agent-skills/index.json`
listing the AI-relevant capabilities this site exposes. Per the Agent Skills
Discovery RFC (v0.2.0, Cloudflare/agentskills.io).

```json
{
  "$schema": "https://agentskills.io/schema/v0.2.0/index.json",
  "skills": [
    {
      "name": "llms-index",
      "type": "llms-txt",
      "description": "Full index of blog posts in LLM-friendly text format",
      "url": "https://aleromano.com/llms.txt"
    },
    {
      "name": "llms-full",
      "type": "llms-txt-full",
      "description": "Full content corpus of all blog posts",
      "url": "https://aleromano.com/llms-full.txt"
    },
    {
      "name": "rss-feed",
      "type": "rss",
      "description": "RSS feed for blog posts",
      "url": "https://aleromano.com/rss.xml"
    }
  ]
}
```

Note: this spec is still a draft RFC but has low implementation cost (a single
static JSON file). Skip `sha256` digests for now — the spec allows omitting them,
and maintaining them for dynamic content adds friction.

**Files to create:**
- `src/pages/.well-known/agent-skills/index.json.ts` — GET endpoint, `prerender = true`

---

## 7. Structured Data (JSON-LD)

**What:** Add a `BlogPosting` JSON-LD block to every blog post page with fields
that AI agents and search engines benefit from:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "headline": "...",
      "description": "...",
      "articleBody": "...",
      "wordCount": 1234,
      "timeRequired": "PT5M",
      "datePublished": "2025-01-01",
      "url": "https://aleromano.com/posts/my-post",
      "author": {
        "@type": "Person",
        "name": "Alessandro Romano",
        "url": "https://aleromano.com/about",
        "knowsAbout": ["SRE", "Backend Engineering", "Web Development"]
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Blog", "item": "https://aleromano.com/blog" },
        { "@type": "ListItem", "position": 2, "name": "Post title", "item": "https://aleromano.com/posts/my-post" }
      ]
    }
  ]
}
```

`wordCount` — whitespace-split token count of `post.body`.
`timeRequired` — word count ÷ 200 wpm, formatted as ISO 8601 (`PT5M`).
`articleBody` — `post.body` (raw markdown; consumers can strip syntax).

**Files to edit:**
- `src/layouts/BlogPostLayout.astro` — inject `<script type="application/ld+json">`

---

## 8. Sitemap — Per-Post `lastmod`

**What:** The current sitemap config uses `lastmod: new Date()` (build time), which
tells crawlers everything was just updated. Replace with per-post `lastmod` derived
from `pubDate` in each post's frontmatter, so freshness signals are accurate.

**How:** The `@astrojs/sitemap` integration supports a `serialize` hook that receives
each page URL and lets you return a custom `lastmod`. Inside that hook, build a map
of `URL → pubDate` from the blog collection and look up each post page.

**Files to edit:**
- `astro.config.mjs` — update `sitemap()` integration config

---

## 9. Blog Post — "Making My Site Agent-Ready"

**Slug:** `agent-ready`
**File:** `src/content/blog/en/agent-ready.md`
**Image:** `src/assets/blog/agent-ready/agent-ready-before.png` (already in place)

**Frontmatter:**
```yaml
---
title: "Making My Site Agent-Ready"
description: "..."
pubDate: <date of writing>
author: "Alessandro Romano"
tags: ["AI", "Web Development", "SEO", "Astro"]
language: "en"
image:
    url: ../../../assets/blog/agent-ready/agent-ready-before.png
    alt: "..."
---
```

**Suggested structure:**

1. **What "agent-ready" means** — the shift from browsers to AI agents as a primary
   consumer of web content; what agents need that browsers don't
2. **The audit** — running isitagentready.com, what it flagged, how to read the results
3. **What I implemented** (walk through each technique with a "before / why / how"):
   - Markdown mirror at `.md` URLs (token cost savings)
   - `<link rel="alternate">` + `Link:` response headers (RFC 8288)
   - `llms.txt` and `llms-full.txt`
   - Content Signals in `robots.txt`
   - Agent Skills Discovery Index (`/.well-known/agent-skills/index.json`)
   - JSON-LD `BlogPosting` schema (word count, reading time, `knowsAbout`)
   - Sitemap `lastmod` per post
4. **What I skipped and why** — Cloudflare-specific features, OAuth discovery,
   MCP server card (not applicable), WebMCP (too experimental)
5. **Results / re-audit** — screenshot or score from isitagentready.com after the changes
   (the existing image `agent-ready-before.png` suggests an "after" screenshot will
   be taken once the implementation is done)

**Note:** Write the article after all implementation items (1–8) are complete, so
the "after" audit results can be included and the code references are accurate.

---

## Implementation Order

1. `robots.txt` update (trivial)
2. Sitemap `lastmod` fix (one config change)
3. Markdown mirror endpoint (`[...slug].md.ts`)
4. Link tag in `<head>` + Link response headers in middleware (both touch the same area)
5. LLM index files (depends on markdown endpoint existing)
6. Agent skills discovery index (depends on LLM files existing)
7. JSON-LD structured data (independent)
8. Blog post `agent-ready.md` (write after all above are done and re-audited)

---

## Skipped — with reasoning

| Suggestion | Reason skipped |
|---|---|
| Markdown via `Accept:` header | Static `.md` URLs (item 3) cover the same use case with zero complexity; Accept negotiation is hard to cache |
| API Catalog (RFC 9727) | Site has no public API; `/api/` routes are internal-only |
| OAuth/OIDC discovery | Not applicable — admin uses HTTP Basic Auth, no OAuth anywhere |
| OAuth Protected Resource Metadata | Same as above |
| MCP Server Card | Site exposes no MCP server; spec is still an open draft PR |
| WebMCP (`navigator.modelContext`) | Chrome-only experimental browser API, not appropriate for a personal blog |
| Cloudflare `_headers` / `wrangler.jsonc` | Hetzner/nginx deployment, no Cloudflare |
| Italian posts in llms files | Translations excluded to avoid duplicate content in AI corpora |
