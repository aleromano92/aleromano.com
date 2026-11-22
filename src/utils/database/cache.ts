import Database from 'better-sqlite3';
import { getDatabase } from './connection';

export interface CacheDTO {
  key: string;
  value: string;
  created_at: number;
  expires_at: number;
}

export interface CacheManager {
  set(key: string, value: string, ttl: number): void;
  get(key: string): string | null;
  getStale(key: string): string | null;
  has(key: string): boolean;
  delete(key: string): void;
  clearExpired(): number;
  clearAll(): number;
}

export class DatabaseCacheManager implements CacheManager {
  private db: Database.Database;
  
  constructor() {
    this.db = getDatabase();
  }
  
  set(key: string, valueJson: string, ttlMs: number): void {
    const now = Date.now();
    const expiresAt = now + ttlMs;
    
    const statement = this.db.prepare(`
      INSERT OR REPLACE INTO cache (key, value, created_at, expires_at)
      VALUES (?, ?, ?, ?)
    `);
    
    statement.run(key, valueJson, now, expiresAt);
  }
  
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
  
  getStale(key: string): string | null {
    const statement = this.db.prepare(`
      SELECT value 
      FROM cache 
      WHERE key = ?
    `);
    
    const row = statement.get(key) as Pick<CacheDTO, 'value'> | undefined;
    
    return row ? row.value : null;
  }
  
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
  
  delete(key: string): void {
    const statement = this.db.prepare(`
      DELETE FROM cache WHERE key = ?
    `);
    
    statement.run(key);
  }
  
  clearExpired(): number {
    const now = Date.now();
    
    const statement = this.db.prepare(`
      DELETE FROM cache WHERE expires_at <= ?
    `);
    
    const result = statement.run(now);
    return result.changes;
  }
  
  clearAll(): number {
    const statement = this.db.prepare(`DELETE FROM cache`);
    const result = statement.run();
    return result.changes;
  }
}

let cacheManagerInstance: DatabaseCacheManager | null = null;

export const cacheManager = {
  get instance(): DatabaseCacheManager {
    if (!cacheManagerInstance) {
      cacheManagerInstance = new DatabaseCacheManager();
    }
    return cacheManagerInstance;
  },
  set: (key: string, valueJson: string, ttlMs: number) => cacheManager.instance.set(key, valueJson, ttlMs),
  get: (key: string) => cacheManager.instance.get(key),
  getStale: (key: string) => cacheManager.instance.getStale(key),
  has: (key: string) => cacheManager.instance.has(key),
  delete: (key: string) => cacheManager.instance.delete(key),
  clearExpired: () => cacheManager.instance.clearExpired(),
  clearAll: () => cacheManager.instance.clearAll(),
};
