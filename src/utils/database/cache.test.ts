// Set DATABASE_PATH before importing database module
process.env.DATABASE_PATH = './data/cache-test.db';

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { DatabaseCacheManager, type CacheManager } from './cache';
import { closeDatabase } from './connection';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  
  beforeEach(() => {
    cacheManager = new DatabaseCacheManager();
    cacheManager.clearAll();
  });
  
  afterAll(() => {
    // Clean up test database
    closeDatabase();
    const testDbPath = join(process.cwd(), 'data', 'cache-test.db');
    if (existsSync(testDbPath)) {
      try {
        unlinkSync(testDbPath);
      } catch (error) {
        console.warn('Could not delete test database:', error);
      }
    }
  });
  
  describe('set and get', () => {
    it('should store and retrieve a value', () => {
      const testData = { message: 'Hello, World!' };
      const testDataJson = JSON.stringify(testData);
      
      cacheManager.set('test-key', testDataJson, 60000); // 1 minute TTL
      
      const retrieved = cacheManager.get('test-key');
      expect(retrieved).toBe(testDataJson);
      expect(JSON.parse(retrieved!)).toEqual(testData);
    });
    
    it('should handle different data types', () => {
      cacheManager.set('string', JSON.stringify('hello'), 60000);
      cacheManager.set('number', JSON.stringify(42), 60000);
      cacheManager.set('boolean', JSON.stringify(true), 60000);
      cacheManager.set('array', JSON.stringify([1, 2, 3]), 60000);
      cacheManager.set('object', JSON.stringify({ nested: { value: 'test' } }), 60000);
      
      expect(JSON.parse(cacheManager.get('string')!)).toBe('hello');
      expect(JSON.parse(cacheManager.get('number')!)).toBe(42);
      expect(JSON.parse(cacheManager.get('boolean')!)).toBe(true);
      expect(JSON.parse(cacheManager.get('array')!)).toEqual([1, 2, 3]);
      expect(JSON.parse(cacheManager.get('object')!)).toEqual({ nested: { value: 'test' } });
    });
    
    it('should return null for non-existent keys', () => {
      const result = cacheManager.get('non-existent');
      expect(result).toBeNull();
    });
    
    it('should return null for expired entries', () => {
      cacheManager.set('expired-key', JSON.stringify('value'), 1); // 1ms TTL
      
      // Wait for expiration
      return new Promise(resolve => {
        setTimeout(() => {
          const result = cacheManager.get('expired-key');
          expect(result).toBeNull();
          resolve(undefined);
        }, 10);
      });
    });
    
    it('should replace existing values', () => {
      cacheManager.set('key', JSON.stringify('value1'), 60000);
      cacheManager.set('key', JSON.stringify('value2'), 60000);
      
      expect(JSON.parse(cacheManager.get('key')!)).toBe('value2');
    });
  });
  
  describe('getStale', () => {
    it('should retrieve expired entries', () => {
      const testValue = JSON.stringify('stale-value');
      cacheManager.set('stale-key', testValue, 1); // 1ms TTL
      
      // Wait for expiration
      return new Promise(resolve => {
        setTimeout(() => {
          const fresh = cacheManager.get('stale-key');
          const stale = cacheManager.getStale('stale-key');
          
          expect(fresh).toBeNull();
          expect(stale).toBe(testValue);
          resolve(undefined);
        }, 10);
      });
    });
    
    it('should return null for non-existent keys', () => {
      const result = cacheManager.getStale('non-existent');
      expect(result).toBeNull();
    });
  });
  
  describe('has', () => {
    it('should return true for valid entries', () => {
      cacheManager.set('key', JSON.stringify('value'), 60000);
      expect(cacheManager.has('key')).toBe(true);
    });
    
    it('should return false for non-existent keys', () => {
      expect(cacheManager.has('non-existent')).toBe(false);
    });
    
    it('should return false for expired entries', () => {
      cacheManager.set('expired-key', JSON.stringify('value'), 1); // 1ms TTL
      
      return new Promise(resolve => {
        setTimeout(() => {
          expect(cacheManager.has('expired-key')).toBe(false);
          resolve(undefined);
        }, 10);
      });
    });
  });
  
  describe('delete', () => {
    it('should delete a cache entry', () => {
      cacheManager.set('key', JSON.stringify('value'), 60000);
      expect(cacheManager.has('key')).toBe(true);
      
      cacheManager.delete('key');
      expect(cacheManager.has('key')).toBe(false);
    });
    
    it('should handle deleting non-existent keys', () => {
      expect(() => {
        cacheManager.delete('non-existent');
      }).not.toThrow();
    });
  });
  
  describe('clearExpired', () => {
    it('should remove only expired entries', () => {
      cacheManager.set('valid-1', JSON.stringify('value'), 60000);
      cacheManager.set('valid-2', JSON.stringify('value'), 60000);
      cacheManager.set('expired-1', JSON.stringify('value'), 1);
      cacheManager.set('expired-2', JSON.stringify('value'), 1);
      
      return new Promise(resolve => {
        setTimeout(() => {
          const deletedCount = cacheManager.clearExpired();
          expect(deletedCount).toBe(2);
          
          expect(cacheManager.has('valid-1')).toBe(true);
          expect(cacheManager.has('valid-2')).toBe(true);
          expect(cacheManager.has('expired-1')).toBe(false);
          expect(cacheManager.has('expired-2')).toBe(false);
          
          resolve(undefined);
        }, 10);
      });
    });
  });
  
  describe('clearAll', () => {
    it('should remove all entries', () => {
      cacheManager.set('key1', JSON.stringify('value'), 60000);
      cacheManager.set('key2', JSON.stringify('value'), 60000);
      cacheManager.set('key3', JSON.stringify('value'), 60000);
      
      const deletedCount = cacheManager.clearAll();
      expect(deletedCount).toBe(3);
      
      expect(cacheManager.has('key1')).toBe(false);
      expect(cacheManager.has('key2')).toBe(false);
      expect(cacheManager.has('key3')).toBe(false);
    });
  });
});
