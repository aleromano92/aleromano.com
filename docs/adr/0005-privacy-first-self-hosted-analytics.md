# Privacy-first, self-hosted analytics

Analytics exist to see which content is read, not to profile people. They are collected
first-party into SQLite, with no third-party services (see `CONTEXT.md`), and are designed so
that nothing stored can identify or follow a visitor over time.

## Decisions

- **Opt-outs are honoured before anything is sent.** Global Privacy Control and Do Not Track
  (`'1'`/`'yes'`) both disable tracking, and nothing is tracked in development.
- **Visitors are counted with a hash that rotates daily**:
  SHA-256(IP | User-Agent | date | salt). Unique visitors can be counted per day, with no
  long-term identifier.
- **Stored data is coarse by construction.** The User-Agent is reduced to a few browser/OS
  labels, and the raw string is never kept. Referers keep scheme, host and path, but lose the
  query string and fragment, which can carry search terms, tokens or user IDs. Only `http(s)`
  referers count, and a lone `/` is dropped. Countries come from a local GeoLite2 database
  (`geolite2-redist`), with no external API.
- **Retention is bounded** (GDPR storage limitation, Art. 5(1)(e)): a daily job deletes
  records older than the retention window in `analytics.ts`.
- **Analytics never affect the visitor.** Client sends use `fetch` with `keepalive` and fail
  silently. Time on page is sent on `visibilitychange` (reliable on mobile, unlike
  `beforeunload`), with `pagehide` as the fallback. It is sent only after a minimum dwell time
  that filters accidental clicks and bots.
- **High-frequency events are micro-batched** in memory and flushed on an interval or a size
  threshold. Page views are written directly.
