import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { migrateAnalyticsVisits } from './migrations';

function createLegacyDb(): Database.Database {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE analytics_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      visitor_hash TEXT NOT NULL,
      referer TEXT,
      user_agent TEXT,
      country TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);
  return db;
}

function columnNames(db: Database.Database): string[] {
  return (db.prepare(`PRAGMA table_info(analytics_visits)`).all() as Array<{ name: string }>)
    .map(c => c.name);
}

describe('migrateAnalyticsVisits', () => {
  it('backfills browser/os from legacy user_agent and drops the column', () => {
    const db = createLegacyDb();
    const insert = db.prepare(
      `INSERT INTO analytics_visits (path, visitor_hash, user_agent) VALUES (?, ?, ?)`
    );
    insert.run('/a', 'h1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605 Version/17 Safari/605');
    insert.run('/b', 'h2', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537 Chrome/120.0 Safari/537');
    insert.run('/c', 'h3', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Version/17 Mobile Safari/604');

    migrateAnalyticsVisits(db);

    expect(columnNames(db)).toEqual(expect.arrayContaining(['browser', 'os']));
    expect(columnNames(db)).not.toContain('user_agent');

    const rows = db.prepare(`SELECT path, browser, os FROM analytics_visits ORDER BY path`).all();
    expect(rows).toEqual([
      { path: '/a', browser: 'Safari', os: 'macOS' },
      { path: '/b', browser: 'Chrome', os: 'Windows' },
      { path: '/c', browser: 'Safari', os: 'iOS' },
    ]);
  });

  it('handles rows with NULL user_agent — drops the column when nothing to backfill', () => {
    const db = createLegacyDb();
    db.prepare(`INSERT INTO analytics_visits (path, visitor_hash, user_agent) VALUES ('/a', 'h1', NULL)`).run();

    migrateAnalyticsVisits(db);

    expect(columnNames(db)).not.toContain('user_agent');
    expect(columnNames(db)).toEqual(expect.arrayContaining(['browser', 'os']));
    const row = db.prepare(`SELECT browser, os FROM analytics_visits`).get() as { browser: string | null; os: string | null };
    expect(row).toEqual({ browser: null, os: null });
  });

  it('is idempotent — running twice on the new schema is a no-op', () => {
    const db = createLegacyDb();
    db.prepare(`INSERT INTO analytics_visits (path, visitor_hash, user_agent) VALUES ('/a', 'h1', 'Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile Safari/537')`).run();

    migrateAnalyticsVisits(db);
    const firstColumns = columnNames(db);
    const firstRow = db.prepare(`SELECT browser, os FROM analytics_visits`).get();

    migrateAnalyticsVisits(db);
    const secondColumns = columnNames(db);
    const secondRow = db.prepare(`SELECT browser, os FROM analytics_visits`).get();

    expect(secondColumns).toEqual(firstColumns);
    expect(secondRow).toEqual(firstRow);
    expect(secondRow).toEqual({ browser: 'Chrome', os: 'Android' });
  });

  it('does nothing when run on a fresh schema that already has browser/os', () => {
    const db = new Database(':memory:');
    db.exec(`
      CREATE TABLE analytics_visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL,
        visitor_hash TEXT NOT NULL,
        referer TEXT,
        browser TEXT,
        os TEXT,
        country TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);

    expect(() => migrateAnalyticsVisits(db)).not.toThrow();
    expect(columnNames(db)).not.toContain('user_agent');
  });
});
