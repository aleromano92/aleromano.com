import { createHash } from 'crypto';
import { getDatabase } from './connection';
import type { VisitRecord, EventRecord, DailyStats, TopPage, TopReferer, CountryStats, EventTypeBreakdown } from '../../types/analytics';

// Re-export types for compatibility with existing imports
export type { VisitRecord, EventRecord, DailyStats, TopPage, TopReferer, CountryStats, EventTypeBreakdown };

// ============================================================================
// Visitor Hash Generation (Privacy-preserving daily rotation)
// ============================================================================

const HASH_SALT = (() => {
  const salt = import.meta.env.ANALYTICS_SALT || process.env.ANALYTICS_SALT;
  if (!salt) {
    throw new Error(
      'ANALYTICS_SALT environment variable must be set to a secret value for analytics hashing.'
    );
  }
  return salt;
})();

/**
 * Generate a privacy-preserving visitor hash that rotates daily.
 * This allows counting unique visitors per day without long-term tracking.
 * 
 * Hash = SHA256(IP + UserAgent + Date + Salt)
 */
export function generateVisitorHash(ip: string, userAgent: string): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const input = `${ip}|${userAgent}|${today}|${HASH_SALT}`;
  return createHash('sha256').update(input).digest('hex').substring(0, 16);
}

// ============================================================================
// Event Buffer (In-memory micro-batching for high-frequency events)
// ============================================================================

const eventBuffer: EventRecord[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL_MS = 5000; // Flush every 5 seconds
const FLUSH_THRESHOLD = 50; // Or when buffer reaches 50 items

function scheduleFlush(): void {
  if (flushTimer) return;
  
  flushTimer = setTimeout(() => {
    flushEventBuffer();
    flushTimer = null;
  }, FLUSH_INTERVAL_MS);
}

function flushEventBuffer(): void {
  if (eventBuffer.length === 0) return;
  
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO analytics_events 
    (type, path, visitor_hash, element_tag, element_id, element_text, href, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertMany = db.transaction((events: EventRecord[]) => {
    for (const event of events) {
      stmt.run(
        event.type,
        event.path,
        event.visitorHash || null,
        event.elementTag || null,
        event.elementId || null,
        event.elementText || null,
        event.href || null,
        event.duration || null
      );
    }
  });
  
  const eventsToFlush = eventBuffer.splice(0, eventBuffer.length);
  
  try {
    insertMany(eventsToFlush);
  } catch (error) {
    console.error('[Analytics] Failed to flush events:', error);
    // Re-add failed events to buffer (optional: could drop them instead)
    eventBuffer.unshift(...eventsToFlush);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate timestamp for N days ago from current time.
 * Used for filtering analytics queries by time range.
 * 
 * @param days - Number of days to go back from now
 * @returns Unix timestamp (seconds since epoch) for the cutoff time
 */
export function getDaysAgoTimestamp(days: number): number {
  return Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
}

// ============================================================================
// Analytics Manager
// ============================================================================

export const analyticsManager = {
  /**
   * Record a page visit (called from middleware, writes directly)
   */
  recordVisit(visit: VisitRecord): void {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        INSERT INTO analytics_visits (path, visitor_hash, referer, user_agent, country)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        visit.path,
        visit.visitorHash,
        visit.referer || null,
        visit.userAgent || null,
        visit.country || null
      );
    } catch (error) {
      console.error('[Analytics] Failed to record visit:', error);
    }
  },

  /**
   * Queue an event for batched insertion (called from API endpoint)
   */
  queueEvent(event: EventRecord): void {
    eventBuffer.push(event);
    
    if (eventBuffer.length >= FLUSH_THRESHOLD) {
      flushEventBuffer();
    } else {
      scheduleFlush();
    }
  },

  /**
   * Force flush any pending events (call on shutdown)
   */
  flush(): void {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    flushEventBuffer();
  },

  // ==========================================================================
  // Query Methods (for dashboard)
  // ==========================================================================

  /**
   * Get daily statistics for the last N days
   */
  getDailyStats(days: number = 30): DailyStats[] {
    const db = getDatabase();
    const cutoff = getDaysAgoTimestamp(days);
    
    const visitStats = db.prepare(`
      SELECT 
        date(created_at, 'unixepoch') as date,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_hash) as unique_visitors
      FROM analytics_visits
      WHERE created_at >= ?
      GROUP BY date(created_at, 'unixepoch')
      ORDER BY date DESC
    `).all(cutoff) as Array<{ date: string; visits: number; unique_visitors: number }>;
    
    const eventStats = db.prepare(`
      SELECT 
        date(created_at, 'unixepoch') as date,
        COUNT(*) as events
      FROM analytics_events
      WHERE created_at >= ?
      GROUP BY date(created_at, 'unixepoch')
    `).all(cutoff) as Array<{ date: string; events: number }>;
    
    const eventMap = new Map(eventStats.map(e => [e.date, e.events]));
    
    return visitStats.map(v => ({
      date: v.date,
      visits: v.visits,
      uniqueVisitors: v.unique_visitors,
      events: eventMap.get(v.date) || 0
    }));
  },

  /**
   * Get top pages by visit count
   */
  getTopPages(limit: number = 20, days: number = 30): TopPage[] {
    const db = getDatabase();
    const cutoff = getDaysAgoTimestamp(days);
    
    const rows = db.prepare(`
      SELECT 
        path,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_hash) as unique_visitors
      FROM analytics_visits
      WHERE created_at >= ?
      GROUP BY path
      ORDER BY visits DESC
      LIMIT ?
    `).all(cutoff, limit) as Array<{ path: string; visits: number; unique_visitors: number }>;
    
    return rows.map(row => ({
      path: row.path,
      visits: row.visits,
      uniqueVisitors: row.unique_visitors
    }));
  },

  /**
   * Get top referers
   */
  getTopReferers(limit: number = 20, days: number = 30): TopReferer[] {
    const db = getDatabase();
    const cutoff = getDaysAgoTimestamp(days);
    
    return db.prepare(`
      SELECT 
        referer,
        COUNT(*) as visits
      FROM analytics_visits
      WHERE created_at >= ? AND referer IS NOT NULL AND referer != ''
      GROUP BY referer
      ORDER BY visits DESC
      LIMIT ?
    `).all(cutoff, limit) as TopReferer[];
  },

  /**
   * Get average time on page (from time_on_page events)
   */
  getAverageTimeOnPage(days: number = 30): Array<{ path: string; avgDuration: number; samples: number }> {
    const db = getDatabase();
    const cutoff = getDaysAgoTimestamp(days);
    
    const rows = db.prepare(`
      SELECT 
        path,
        ROUND(AVG(duration) / 1000, 1) as avg_duration,
        COUNT(*) as samples
      FROM analytics_events
      WHERE type = 'time_on_page' AND created_at >= ? AND duration IS NOT NULL
      GROUP BY path
      HAVING samples >= 3
      ORDER BY avg_duration DESC
      LIMIT 20
    `).all(cutoff) as Array<{ path: string; avg_duration: number; samples: number }>;
    
    return rows.map(row => ({
      path: row.path,
      avgDuration: row.avg_duration,
      samples: row.samples
    }));
  },

  /**
   * Get recent events (clicks and time-on-page) for dashboard display
   */
  getRecentEvents(limit: number = 50): Array<{
    type: string;
    path: string;
    elementTag: string | null;
    elementId: string | null;
    elementText: string | null;
    href: string | null;
    duration: number | null;
    createdAt: number;
  }> {
    const db = getDatabase();
    
    const rows = db.prepare(`
      SELECT 
        type,
        path,
        element_tag,
        element_id,
        element_text,
        href,
        duration,
        created_at
      FROM analytics_events
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit) as Array<{
      type: string;
      path: string;
      element_tag: string | null;
      element_id: string | null;
      element_text: string | null;
      href: string | null;
      duration: number | null;
      created_at: number;
    }>;
    
    return rows.map(row => ({
      type: row.type,
      path: row.path,
      elementTag: row.element_tag,
      elementId: row.element_id,
      elementText: row.element_text,
      href: row.href,
      duration: row.duration,
      createdAt: row.created_at
    }));
  },

  /**
   * Get visitor counts grouped by country code
   */
  getVisitorsByCountry(days: number = 30): CountryStats[] {
    const db = getDatabase();
    const cutoff = getDaysAgoTimestamp(days);
    
    const rows = db.prepare(`
      SELECT 
        country,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_hash) as unique_visitors
      FROM analytics_visits
      WHERE created_at >= ? AND country IS NOT NULL AND country != ''
      GROUP BY country
      ORDER BY visits DESC
    `).all(cutoff) as Array<{ country: string; visits: number; unique_visitors: number }>;
    
    return rows.map(row => ({
      country: row.country,
      visits: row.visits,
      uniqueVisitors: row.unique_visitors
    }));
  },

  /**
   * Get event counts broken down by type (page_view from visits, click/time_on_page from events)
   */
  getEventBreakdown(days: number = 30): EventTypeBreakdown[] {
    const db = getDatabase();
    const cutoff = getDaysAgoTimestamp(days);
    
    const visitCount = db.prepare(`
      SELECT COUNT(*) as count FROM analytics_visits WHERE created_at >= ?
    `).get(cutoff) as { count: number };
    
    const eventCounts = db.prepare(`
      SELECT type, COUNT(*) as count
      FROM analytics_events
      WHERE created_at >= ?
      GROUP BY type
    `).all(cutoff) as Array<{ type: string; count: number }>;
    
    const breakdown: EventTypeBreakdown[] = [
      { type: 'page_view', count: visitCount.count },
      ...eventCounts
    ];
    
    return breakdown.filter(e => e.count > 0);
  },

  /**
   * Get total stats summary
   */
  getSummary(days: number = 30): { totalVisits: number; uniqueVisitors: number; totalEvents: number; avgTimeOnPage: number } {
    const db = getDatabase();
    const cutoff = getDaysAgoTimestamp(days);
    
    const visitSummary = db.prepare(`
      SELECT 
        COUNT(*) as total_visits,
        COUNT(DISTINCT visitor_hash) as unique_visitors
      FROM analytics_visits
      WHERE created_at >= ?
    `).get(cutoff) as { total_visits: number; unique_visitors: number };
    
    const eventSummary = db.prepare(`
      SELECT 
        COUNT(*) as total_events,
        ROUND(AVG(CASE WHEN type = 'time_on_page' THEN duration END) / 1000, 1) as avg_time
      FROM analytics_events
      WHERE created_at >= ?
    `).get(cutoff) as { total_events: number; avg_time: number | null };
    
    return {
      totalVisits: visitSummary.total_visits,
      uniqueVisitors: visitSummary.unique_visitors,
      totalEvents: eventSummary.total_events,
      avgTimeOnPage: eventSummary.avg_time || 0
    };
  }
};
