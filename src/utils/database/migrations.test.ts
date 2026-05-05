import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { migrateAnalyticsVisits, migrateNormalizeReferer } from './migrations';

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

describe('migrateNormalizeReferer', () => {
  function createDb(): Database.Database {
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
    return db;
  }

  function insert(db: Database.Database, path: string, referer: string | null) {
    db.prepare(`INSERT INTO analytics_visits (path, visitor_hash, referer) VALUES (?, ?, ?)`)
      .run(path, 'h', referer);
  }

  function refererFor(db: Database.Database, path: string): string | null {
    return (db.prepare(`SELECT referer FROM analytics_visits WHERE path = ?`).get(path) as { referer: string | null }).referer;
  }

  it('strips query and fragment but keeps the path', () => {
    const db = createDb();
    insert(db, '/a', 'https://google.com/search?q=secret+search+term');
    insert(db, '/b', 'https://linkedin.com/feed/post/123?utm_source=x');
    insert(db, '/c', 'https://example.com/page#section');

    migrateNormalizeReferer(db);

    expect(refererFor(db, '/a')).toBe('https://google.com/search');
    expect(refererFor(db, '/b')).toBe('https://linkedin.com/feed/post/123');
    expect(refererFor(db, '/c')).toBe('https://example.com/page');
  });

  it('collapses lone "/" so bare-origin variants share a bucket', () => {
    const db = createDb();
    insert(db, '/a', 'https://google.com/');
    insert(db, '/b', 'https://google.com');

    migrateNormalizeReferer(db);

    expect(refererFor(db, '/a')).toBe('https://google.com');
    expect(refererFor(db, '/b')).toBe('https://google.com');
  });

  it('leaves NULL and already-normalized referrers untouched', () => {
    const db = createDb();
    insert(db, '/a', null);
    insert(db, '/b', 'https://google.com');
    insert(db, '/c', 'https://linkedin.com/feed');

    migrateNormalizeReferer(db);

    expect(refererFor(db, '/a')).toBeNull();
    expect(refererFor(db, '/b')).toBe('https://google.com');
    expect(refererFor(db, '/c')).toBe('https://linkedin.com/feed');
  });

  it('nullifies unparseable referrers', () => {
    const db = createDb();
    insert(db, '/a', 'not a url at all');

    migrateNormalizeReferer(db);

    expect(refererFor(db, '/a')).toBeNull();
  });

  it('is idempotent — running twice yields the same result', () => {
    const db = createDb();
    insert(db, '/a', 'https://google.com/search?q=foo');

    migrateNormalizeReferer(db);
    const first = refererFor(db, '/a');
    migrateNormalizeReferer(db);
    const second = refererFor(db, '/a');

    expect(first).toBe('https://google.com/search');
    expect(second).toBe(first);
  });
});
