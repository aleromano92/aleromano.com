#!/usr/bin/env node

/**
 * Seed the local analytics SQLite database with fixture data.
 *
 * Usage:
 *   npm run db:seed          – seed default database (./data/analytics.db)
 *   node scripts/seed-analytics.mjs path/to/db  – seed a specific database
 *
 * The script reads the SQL fixture from src/test/fixtures/analytics-seed.sql,
 * wraps all INSERTs in a transaction for speed, and prints a summary.
 */

import Database from "better-sqlite3";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

// Resolve database path from CLI arg, env var, or default
const dbPath = resolve(
    projectRoot,
    process.argv[2] ?? process.env.DATABASE_PATH ?? "./data/analytics.db"
);

// Ensure the data directory exists
const dataDir = dirname(dbPath);
if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
}

// Read fixture SQL
const sqlPath = resolve(
    projectRoot,
    "src/test/fixtures/analytics-seed.sql"
);
const sql = readFileSync(sqlPath, "utf-8");

console.log(`📂 Database: ${dbPath}`);
console.log(`📄 Fixture:  ${sqlPath}`);
console.log();

// Open DB and ensure the schema exists
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// Create tables if they don't exist yet
db.exec(`
  CREATE TABLE IF NOT EXISTS analytics_visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL,
    visitor_hash TEXT NOT NULL,
    referer TEXT,
    user_agent TEXT,
    country TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    path TEXT NOT NULL,
    visitor_hash TEXT,
    element_tag TEXT,
    element_id TEXT,
    element_text TEXT,
    href TEXT,
    duration INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE INDEX IF NOT EXISTS idx_analytics_visits_created_at ON analytics_visits(created_at);
  CREATE INDEX IF NOT EXISTS idx_analytics_visits_path ON analytics_visits(path);
  CREATE INDEX IF NOT EXISTS idx_analytics_visits_created_at_path ON analytics_visits(created_at, path);
  CREATE INDEX IF NOT EXISTS idx_analytics_visits_country ON analytics_visits(country);
  CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(type);
  CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
  CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created_at ON analytics_events(type, created_at);
`);

// Run the seed inside a transaction
const countBefore = {
    visits: db.prepare("SELECT COUNT(*) as c FROM analytics_visits").get().c,
    events: db.prepare("SELECT COUNT(*) as c FROM analytics_events").get().c,
};

db.exec(sql);

const countAfter = {
    visits: db.prepare("SELECT COUNT(*) as c FROM analytics_visits").get().c,
    events: db.prepare("SELECT COUNT(*) as c FROM analytics_events").get().c,
};

db.close();

console.log("✅ Seed complete!");
console.log();
console.log("  Table              Before  →  After");
console.log("  ─────────────────  ──────     ─────");
console.log(
    `  analytics_visits   ${String(countBefore.visits).padStart(6)}  →  ${countAfter.visits}`
);
console.log(
    `  analytics_events   ${String(countBefore.events).padStart(6)}  →  ${countAfter.events}`
);
