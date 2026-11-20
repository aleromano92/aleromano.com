import Database from 'better-sqlite3';
import { dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { migrateAnalyticsVisits, migrateNormalizeReferer } from './migrations';

const getDatabasePath = (): string => {
  const dbPath = import.meta.env.DATABASE_PATH || process.env.DATABASE_PATH;
  
  if (!dbPath) {
    throw new Error(
      'DATABASE_PATH environment variable is required. '
    );
  }
  
  const dataDir = dirname(dbPath);
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  
  return dbPath;
};

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    const dbPath = getDatabasePath();
    console.log(`Connecting to SQLite database at: ${dbPath}`);
    
    try {
      dbInstance = new Database(dbPath, {
        verbose: process.env.NODE_ENV !== 'production' ? console.log : undefined,
      });
      
      dbInstance.pragma('journal_mode = WAL');
      
      initializeSchema(dbInstance);

      console.log('SQLite database connection established successfully');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }
  
  return dbInstance;
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cache (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_cache_expires_at 
    ON cache(expires_at)
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_visits (
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

  migrateAnalyticsVisits(db);
  migrateNormalizeReferer(db);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_analytics_visits_created_at 
    ON analytics_visits(created_at)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_analytics_visits_path 
    ON analytics_visits(path)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_analytics_visits_created_at_path 
    ON analytics_visits(created_at, path)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_analytics_visits_country 
    ON analytics_visits(country)
  `);

  db.exec(`
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
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_analytics_events_type 
    ON analytics_events(type)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at 
    ON analytics_events(created_at)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created_at 
    ON analytics_events(type, created_at)
  `);
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('SQLite database connection closed');
  }
}
