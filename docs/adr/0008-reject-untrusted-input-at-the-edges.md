# Reject untrusted input at the edges

Some inputs come from places we do not control and reach code that would otherwise trust
them. They are checked where they enter, so a bad value fails early and visibly.

## Decisions

- **Astro's on-demand image endpoint (`/_image`) is guarded in middleware.** Astro answers a
  bad output format, and some malformed source paths, with a 500 instead of a 400.
  Vulnerability scanners stuffing SQL into the query string would then look like server
  failures and trip the nginx 5xx alert. Every image this site serves is a build asset: one
  file directly under `/_astro/`, in one of a handful of formats. Anything else gets a 400
  (`src/utils/image-request.ts`). Revisit if Astro starts returning 4xx itself.
- **Model output is rendered as Markdown without raw HTML.** Built-in AI summaries and
  translations go through `marked` with HTML passthrough disabled, to prevent XSS from model
  output.
