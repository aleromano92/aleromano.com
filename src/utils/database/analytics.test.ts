import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDaysAgoTimestamp, analyticsManager } from './analytics';
import { getDatabase } from './connection';

describe('getDaysAgoTimestamp', () => {
  let originalDateNow: () => number;

  beforeEach(() => {
    originalDateNow = Date.now;
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  it('should calculate correct timestamp for 30 days ago', () => {
    // Mock Date.now to return a fixed timestamp
    const mockNow = 1700000000000; // Mock timestamp in milliseconds
    vi.stubGlobal('Date', {
      ...Date,
      now: () => mockNow
    });

    const result = getDaysAgoTimestamp(30);
    
    // Calculate expected cutoff (30 days ago in seconds)
    const expectedCutoff = Math.floor(mockNow / 1000) - (30 * 24 * 60 * 60);
    
    // The expected cutoff should be:
    // 1700000000 (seconds) - 2592000 (30 days in seconds) = 1697408000
    expect(result).toBe(1697408000);
    expect(result).toBe(expectedCutoff);
  });

  it('should calculate correct timestamp for 7 days ago', () => {
    const mockNow = 1700000000000;
    vi.stubGlobal('Date', {
      ...Date,
      now: () => mockNow
    });

    const result = getDaysAgoTimestamp(7);
    const expectedCutoff = Math.floor(mockNow / 1000) - (7 * 24 * 60 * 60);
    
    // 1700000000 - 604800 (7 days) = 1699395200
    expect(result).toBe(1699395200);
    expect(result).toBe(expectedCutoff);
  });

  it('should calculate correct timestamp for 1 day ago', () => {
    const mockNow = 1700000000000;
    vi.stubGlobal('Date', {
      ...Date,
      now: () => mockNow
    });

    const result = getDaysAgoTimestamp(1);
    const expectedCutoff = Math.floor(mockNow / 1000) - (1 * 24 * 60 * 60);
    
    // 1700000000 - 86400 (1 day) = 1699913600
    expect(result).toBe(1699913600);
    expect(result).toBe(expectedCutoff);
  });

  it('should handle edge case of 0 days', () => {
    const mockNow = 1700000000000;
    vi.stubGlobal('Date', {
      ...Date,
      now: () => mockNow
    });

    const result = getDaysAgoTimestamp(0);
    const expectedCutoff = Math.floor(mockNow / 1000) - (0 * 24 * 60 * 60);
    
    // Should return current timestamp
    expect(result).toBe(1700000000);
    expect(result).toBe(expectedCutoff);
  });
});

describe('analyticsManager query methods', () => {
  function seedDatabase() {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    // Insert visits with different countries
    const insertVisit = db.prepare(`
      INSERT INTO analytics_visits (path, visitor_hash, referer, user_agent, country, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertVisit.run('/', 'hash1', 'https://google.com', 'Mozilla/5.0', 'US', now - 100);
    insertVisit.run('/', 'hash2', 'https://google.com', 'Safari/1.0', 'US', now - 200);
    insertVisit.run('/blog', 'hash1', null, 'Mozilla/5.0', 'IT', now - 300);
    insertVisit.run('/about', 'hash3', 'https://twitter.com', 'Chrome/1.0', 'IT', now - 400);
    insertVisit.run('/blog', 'hash4', null, 'Firefox/1.0', 'DE', now - 500);
    insertVisit.run('/contact', 'hash5', null, 'Edge/1.0', null, now - 600);

    // Insert events of different types
    const insertEvent = db.prepare(`
      INSERT INTO analytics_events (type, path, visitor_hash, element_tag, element_id, element_text, href, duration, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertEvent.run('click', '/', 'hash1', 'a', null, 'Blog', '/blog', null, now - 100);
    insertEvent.run('click', '/blog', 'hash2', 'button', 'cta', 'Sign Up', null, null, now - 200);
    insertEvent.run('time_on_page', '/', 'hash1', null, null, null, null, 45000, now - 300);
    insertEvent.run('time_on_page', '/blog', 'hash3', null, null, null, null, 120000, now - 400);
    insertEvent.run('time_on_page', '/about', 'hash4', null, null, null, null, 30000, now - 500);
  }

  beforeEach(() => {
    // Clear tables before each test
    const db = getDatabase();
    db.exec('DELETE FROM analytics_visits');
    db.exec('DELETE FROM analytics_events');
    seedDatabase();
  });

  describe('getVisitorsByCountry', () => {
    it('should return visitor counts grouped by country', () => {
      const result = analyticsManager.getVisitorsByCountry(30);

      expect(result).toHaveLength(3); // US, IT, DE (null excluded)
      
      const us = result.find(r => r.country === 'US');
      expect(us).toBeDefined();
      expect(us!.visits).toBe(2);
      expect(us!.uniqueVisitors).toBe(2); // hash1, hash2

      const it = result.find(r => r.country === 'IT');
      expect(it).toBeDefined();
      expect(it!.visits).toBe(2);

      const de = result.find(r => r.country === 'DE');
      expect(de).toBeDefined();
      expect(de!.visits).toBe(1);
    });

    it('should exclude entries with null country', () => {
      const result = analyticsManager.getVisitorsByCountry(30);
      const nullCountry = result.find(r => r.country === null || r.country === '');
      expect(nullCountry).toBeUndefined();
    });

    it('should be ordered by visits descending', () => {
      const result = analyticsManager.getVisitorsByCountry(30);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].visits).toBeGreaterThanOrEqual(result[i].visits);
      }
    });

    it('should return empty array when no data exists', () => {
      const db = getDatabase();
      db.exec('DELETE FROM analytics_visits');

      const result = analyticsManager.getVisitorsByCountry(30);
      expect(result).toEqual([]);
    });
  });

  describe('getEventBreakdown', () => {
    it('should return counts for all event types including page_view', () => {
      const result = analyticsManager.getEventBreakdown(30);

      const pageViews = result.find(r => r.type === 'page_view');
      expect(pageViews).toBeDefined();
      expect(pageViews!.count).toBe(6); // 6 visits

      const clicks = result.find(r => r.type === 'click');
      expect(clicks).toBeDefined();
      expect(clicks!.count).toBe(2);

      const timeOnPage = result.find(r => r.type === 'time_on_page');
      expect(timeOnPage).toBeDefined();
      expect(timeOnPage!.count).toBe(3);
    });

    it('should filter out types with zero count', () => {
      const db = getDatabase();
      db.exec("DELETE FROM analytics_events WHERE type = 'click'");

      const result = analyticsManager.getEventBreakdown(30);
      const clicks = result.find(r => r.type === 'click');
      expect(clicks).toBeUndefined();
    });

    it('should return empty array when no data exists', () => {
      const db = getDatabase();
      db.exec('DELETE FROM analytics_visits');
      db.exec('DELETE FROM analytics_events');

      const result = analyticsManager.getEventBreakdown(30);
      expect(result).toEqual([]);
    });
  });

  describe('getTopPages', () => {
    it('should return pages ordered by visits descending', () => {
      const result = analyticsManager.getTopPages(10, 30);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].path).toBe('/'); // 2 visits
      expect(result[0].visits).toBe(2);
    });
  });

  describe('getTopReferers', () => {
    it('should return referers excluding nulls', () => {
      const result = analyticsManager.getTopReferers(10, 30);

      expect(result.length).toBeGreaterThan(0);
      const google = result.find(r => r.referer === 'https://google.com');
      expect(google).toBeDefined();
      expect(google!.visits).toBe(2);
    });
  });

  describe('getSummary', () => {
    it('should return correct totals', () => {
      const result = analyticsManager.getSummary(30);

      expect(result.totalVisits).toBe(6);
      expect(result.uniqueVisitors).toBe(5); // hash1-hash5
      expect(result.totalEvents).toBe(5); // 2 clicks + 3 time_on_page
    });
  });
});
