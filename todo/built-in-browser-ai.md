# Built-in Browser AI: Summarize & Translate Blog Posts

## Status: SHIPPED ✅

## Inspiration

Inspired by [this WebDay session](https://www.webdayconf.it/e/sessione/5092/AI-nel-browser-costruire-feature-con-le-Built-in-AI-API) about Chrome's Built-in AI APIs — small models running entirely on the visitor's machine for tasks like summarization and translation.

## Goal

Add AI-powered summarization and translation to all blog posts using Chrome's [Summarizer API](https://developer.chrome.com/docs/ai/summarizer-api) and [Translator API](https://developer.chrome.com/docs/ai/translator-api). Everything runs client-side — no data leaves the browser.

## Outcome

Feature is live on all blog posts. Blog post drafting in progress at `src/content/blog/en/built-in-browser-ai.md`.

---

## Design Decisions

### Callout UI: Collapsible `<details>` element

Placed at the top of every blog post (inside `BlogPostLayout.astro`), before the post content. Uses native `<details>/<summary>` for accessibility and lightweight feel.

**Graceful degradation:**
- If neither Summarizer nor Translator API is available → the `<details>` element is hidden entirely.
- If only one API is available → show only the relevant buttons.

### Output: Bottom sheet panel

AI-generated content appears in a bottom sheet that slides up from the bottom of the viewport. Streams token-by-token. Auto-scrolls as content arrives.

### Summarization

- **TL;DR** — uses `type: 'tldr'` (changed from `'tl;dr'` — API enum changed in Chrome 138+)
- **Key Points** — uses `type: 'key-points'` with `format: 'markdown'`

Both buttons styled as primary (accent fill).

### Translation

Smart logic based on `navigator.language`:
- If user's browser language is `en` or `it` → no translate button (site natively supports both)
- Otherwise → "Translate to {language name}" button with ghost/outlined style

---

## Implementation: What Was Actually Built

### Files Created

| File | Purpose |
|------|---------|
| `src/utils/built-in-ai.ts` | API detection (`detectFeatures`) + `summarize()` + `translate()` wrappers |
| `src/components/BuiltInAIBottomSheet.astro` | Slide-up bottom sheet, markdown rendering via `marked`, auto-scroll |
| `src/components/posts/BuiltInAICallout.astro` | Collapsible `<details>` callout with i18n (EN/IT) |

### Files Modified

| File | Change |
|------|--------|
| `src/layouts/BlogPostLayout.astro` | Added `<BuiltInAICallout>` and `<BuiltInAIBottomSheet>` |
| `src/types/analytics.ts` | Added `'ai_feature'` event type |
| `src/pages/api/analytics/collect.ts` | Accept `'ai_feature'` event type |
| `src/utils/database/analytics.ts` | Added `getAIFeatureStats()` query method |
| `src/pages/admin/analytics.astro` | Added Built-in AI section to dashboard |
| `src/scripts/analytics.ts` | Exported `trackEvent()` helper |

### Key Implementation Details

- **API globals**: `'Summarizer' in self` / `'Translator' in self` (NOT `window.ai.*`)
- **Summarizer type**: `'tldr'` (no punctuation — Chrome 138+ enum, not `'tl;dr'`)
- **Streaming modes**: Both Summarizer and Translator now stream **deltas** → always use `mode: 'append'`
- **Loading dots fix**: `.loading[hidden] { display: none }` to override `display: flex`
- **Markdown**: `marked` library renders Summarizer output (key-points is markdown)
- **Auto-scroll**: `sheetContent.scrollTop = sheetContent.scrollHeight` after each chunk

### API Availability (Chrome 146)

| API | Flag |
|-----|------|
| Summarizer | No flag needed in Chrome 146 (was `#summarization-api-for-gemini-nano` in Chrome 138) |
| Translator | `#translation-api-streaming-by-sentence` → Enabled |
| Gemini Nano model | `#optimization-guide-on-device-model` → Enabled BypassPerfRequirement; then `chrome://components` → Optimization Guide On Device Model → Check for update |

### Analytics Events Emitted

| Event | `elementId` | `elementText` |
|-------|------------|---------------|
| APIs detected | `ai-features-detected` | e.g. `"summarize,translate:fr-FR"` |
| Button clicked | `ai-feature-clicked` | e.g. `"tldr"`, `"key-points"`, `"translate:fr-FR"` |
| Streaming completed | `ai-feature-completed` | same as clicked |

---

## Graceful Degradation

| Scenario | Behavior |
|----------|----------|
| Both APIs available | All buttons shown |
| Only Summarizer | TL;DR + Key Points shown |
| Only Translator | Translate button shown |
| None available | Entire callout hidden |
| API call fails | Error message in bottom sheet |

---

## Next Step

Write the blog post at `src/content/blog/en/built-in-browser-ai.md` and link to it from the callout (`learnMoreUrl` in `BuiltInAICallout.astro`).
