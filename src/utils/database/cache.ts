import Database from 'better-sqlite3';
import { getDatabase } from './connection';

/**
 * Data Transfer Object representing the cache table schema in SQLite
 * Matches the exact structure of rows stored in the database
 */
export interface CacheDTO {
  key: string;
  value: string;  // JSON stringified
  created_at: number;
  expires_at: number;
}

/**
 * Interface for cache operations
 */
export interface CacheManager {
  set(key: string, value: string, ttl: number): void;
  get(key: string): string | null;
  getStale(key: string): string | null;
  has(key: string): boolean;
  delete(key: string): void;
  clearExpired(): number;
  clearAll(): number;
}

/**
 * Cache operations for storing arbitrary data with TTL in SQLite
 */
export class DatabaseCacheManager implements CacheManager {
  private db: Database.Database;
  
  constructor() {
    this.db = getDatabase();
  }
  
  /**
   * Store a value in cache with TTL
   * @param key - Unique cache key
   * @param valueJson - JSON string to cache (must be pre-stringified)
   * @param ttlMs - Time to live in milliseconds
   */
  set(key: string, valueJson: string, ttlMs: number): void {
    const now = Date.now();
    const expiresAt = now + ttlMs;
    
    const statement = this.db.prepare(`
      INSERT OR REPLACE INTO cache (key, value, created_at, expires_at)
      VALUES (?, ?, ?, ?)
    `);
    
    statement.run(key, valueJson, now, expiresAt);
  }
  
  /**
   * Get a value from cache if it exists and hasn't expired
   * @param key - Cache key to retrieve
   * @returns JSON string or null if not found or expired
   */
  get(key: string): string | null {
    const now = Date.now();
    
    const statement = this.db.prepare(`
      SELECT value, expires_at 
      FROM cache 
      WHERE key = ? AND expires_at > ?
    `);
    
    const row = statement.get(key, now) as Pick<CacheDTO, 'value' | 'expires_at'> | undefined;
    
    return row ? row.value : null;
  }
  
  /**
   * Get a value from cache even if expired (stale data)
   * Useful as fallback when fresh data can't be fetched
   * @param key - Cache key to retrieve
   * @returns JSON string or null if not found
   */
  getStale(key: string): string | null {
    const statement = this.db.prepare(`
      SELECT value 
      FROM cache 
      WHERE key = ?
    `);
    
    const row = statement.get(key) as Pick<CacheDTO, 'value'> | undefined;
    
    return row ? row.value : null;
  }
  
  /**
   * Check if a cache entry exists and is valid
   * @param key - Cache key to check
   * @returns true if entry exists and hasn't expired
   */
  has(key: string): boolean {
    const now = Date.now();
    
    const statement = this.db.prepare(`
      SELECT 1 
      FROM cache 
      WHERE key = ? AND expires_at > ?
    `);
    
    const row = statement.get(key, now);
    return row !== undefined;
  }
  
  /**
   * Delete a specific cache entry
   * @param key - Cache key to delete
   */
  delete(key: string): void {
    const statement = this.db.prepare(`
      DELETE FROM cache WHERE key = ?
    `);
    
    statement.run(key);
  }
  
  /**
   * Clear all expired cache entries
   * Returns number of entries deleted
   */
  clearExpired(): number {
    const now = Date.now();
    
    const statement = this.db.prepare(`
      DELETE FROM cache WHERE expires_at <= ?
    `);
    
    const result = statement.run(now);
    return result.changes;
  }
  
  /**
   * Clear all cache entries
   * Returns number of entries deleted
   */
  clearAll(): number {
    const statement = this.db.prepare(`DELETE FROM cache`);
    const result = statement.run();
    return result.changes;
  }
}

/**
 * Export a singleton cache manager instance (lazy initialization)
 */
let cacheManagerInstance: DatabaseCacheManager | null = null;

export const cacheManager = {
  get instance(): DatabaseCacheManager {
    if (!cacheManagerInstance) {
      cacheManagerInstance = new DatabaseCacheManager();
    }
    return cacheManagerInstance;
  },
  // Proxy all CacheManager methods
  set: (key: string, valueJson: string, ttlMs: number) => cacheManager.instance.set(key, valueJson, ttlMs),
  get: (key: string) => cacheManager.instance.get(key),
  getStale: (key: string) => cacheManager.instance.getStale(key),
  has: (key: string) => cacheManager.instance.has(key),
  delete: (key: string) => cacheManager.instance.delete(key),
  clearExpired: () => cacheManager.instance.clearExpired(),
  clearAll: () => cacheManager.instance.clearAll(),
};
