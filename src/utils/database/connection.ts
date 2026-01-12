import Database from 'better-sqlite3';
import { dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';

const getDatabasePath = (): string => {
  const dbPath = import.meta.env.DATABASE_PATH || process.env.DATABASE_PATH;
  
  if (!dbPath) {
    throw new Error(
      'DATABASE_PATH environment variable is required. '
    );
  }
  
  // Ensure parent directory exists
  const dataDir = dirname(dbPath);
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  
  return dbPath;
};

// Singleton database instance
let dbInstance: Database.Database | null = null;

/**
 * Get or create the database connection
 * 
 * Uses singleton pattern to ensure only one connection exists throughout the application.
 * This is critical for SQLite because:
 * 
 * 1. **Write Serialization**: SQLite allows multiple readers but only one writer at a time.
 *    A single connection prevents "database is locked" errors from concurrent writes.
 * 
 * 2. **WAL Mode Efficiency**: With Write-Ahead Logging (WAL), a single connection can
 *    efficiently manage the WAL file without conflicts from multiple connections.
 * 
 * 3. **Resource Management**: Database connections consume file descriptors and memory.
 *    A singleton prevents resource exhaustion from connection pooling overhead.
 * 
 * 4. **Schema Consistency**: Schema initialization happens once, ensuring all code
 *    uses the same database structure without race conditions.
 * 
 * 5. **Transaction Safety**: A single connection ensures predictable transaction
 *    behavior without conflicts between multiple connection instances.
 */
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
  // Cache table for storing API responses with TTL
  db.exec(`
    CREATE TABLE IF NOT EXISTS cache (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `);
  
  // Index for efficient expiration queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_cache_expires_at 
    ON cache(expires_at)
  `);

  // Analytics: Server-side page views (captured by middleware)
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      visitor_hash TEXT NOT NULL,
      referer TEXT,
      user_agent TEXT,
      country TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Indexes for efficient analytics queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_analytics_visits_created_at 
    ON analytics_visits(created_at)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_analytics_visits_path 
    ON analytics_visits(path)
  `);

  // Analytics: Client-side events (clicks, time on page)
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

  // Indexes for event queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_analytics_events_type 
    ON analytics_events(type)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at 
    ON analytics_events(created_at)
  `);
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('SQLite database connection closed');
  }
}
