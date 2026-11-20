# SQLite through one connection, with idempotent in-code migrations

SQLite (`better-sqlite3`) is the only persistence layer: the API response cache and
analytics. Each process opens **one shared connection**, not a pool. SQLite serializes writers
anyway, so one connection avoids "database is locked" errors. It also lets WAL work without
contention, keeps file descriptors bounded, and makes schema setup and transactions
predictable.

## Decisions

- **Schema changes are idempotent functions** (`src/utils/database/migrations.ts`) run at
  startup, not a migration framework. Each step checks the current schema and skips work
  already done, so they are safe to run on every boot.
- **The cache serves stale data as a fallback.** Entries have a per-source TTL. When a
  refresh fails, the last value is served even if expired, so a flaky third-party API never
  blanks a section. The GitHub commits cache uses a short TTL (10 minutes), because commits
  change often.
