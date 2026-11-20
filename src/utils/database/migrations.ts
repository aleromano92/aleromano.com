import type Database from 'better-sqlite3';
import { parseUserAgent } from '../user-agent';
import { normalizeReferer } from '../referer';

export function migrateAnalyticsVisits(db: Database.Database): void {
  const cols = (db.prepare(`PRAGMA table_info(analytics_visits)`).all() as Array<{ name: string }>)
    .map(c => c.name);

  if (!cols.includes('browser')) {
    db.exec(`ALTER TABLE analytics_visits ADD COLUMN browser TEXT`);
  }
  if (!cols.includes('os')) {
    db.exec(`ALTER TABLE analytics_visits ADD COLUMN os TEXT`);
  }

  if (!cols.includes('user_agent')) return;

  const rows = db.prepare(
    `SELECT id, user_agent FROM analytics_visits WHERE user_agent IS NOT NULL`
  ).all() as Array<{ id: number; user_agent: string }>;

  const update = db.prepare(
    `UPDATE analytics_visits SET browser = ?, os = ?, user_agent = NULL WHERE id = ?`
  );
  const backfill = db.transaction((batch: typeof rows) => {
    for (const row of batch) {
      const { browser, os } = parseUserAgent(row.user_agent);
      update.run(browser, os, row.id);
    }
  });
  backfill(rows);

  const remaining = (db.prepare(
    `SELECT COUNT(*) AS c FROM analytics_visits WHERE user_agent IS NOT NULL`
  ).get() as { c: number }).c;

  if (remaining === 0) {
    db.exec(`ALTER TABLE analytics_visits DROP COLUMN user_agent`);
  } else {
    console.warn(
      `[Migration] analytics_visits has ${remaining} rows with non-null user_agent after backfill; column not dropped.`
    );
  }
}

export function migrateNormalizeReferer(db: Database.Database): void {
  const rows = db.prepare(
    `SELECT id, referer FROM analytics_visits WHERE referer IS NOT NULL AND referer != ''`
  ).all() as Array<{ id: number; referer: string }>;

  const update = db.prepare(`UPDATE analytics_visits SET referer = ? WHERE id = ?`);
  const run = db.transaction((batch: typeof rows) => {
    for (const row of batch) {
      const normalized = normalizeReferer(row.referer);
      if (normalized !== row.referer) {
        update.run(normalized, row.id);
      }
    }
  });
  run(rows);
}
