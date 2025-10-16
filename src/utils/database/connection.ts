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
    console.log(`Initializing SQLite database at: ${dbPath}`);
    
    try {
      dbInstance = new Database(dbPath, {
        verbose: process.env.NODE_ENV !== 'production' ? console.log : undefined,
      });
      
      dbInstance.pragma('journal_mode = WAL');
      
      initializeSchema(dbInstance);
      
      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
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
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('SQLite database connection closed');
  }
}
