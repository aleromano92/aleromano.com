/**
 * Analytics event types shared between client and server
 */

/**
 * Client-side event sent to the analytics API endpoint.
 * All event types (page_view, click, time_on_page) use this interface.
 */
export interface AnalyticsEvent {
  type: 'page_view' | 'click' | 'time_on_page';
  path: string;
  referer?: string;
  elementTag?: string;
  elementId?: string;
  elementText?: string;
  href?: string;
  duration?: number;
}

/**
 * Database record types for analytics storage
 */

/**
 * Database record for page view events.
 * Page views are stored separately in the visits table with visitor tracking.
 */
export interface VisitRecord {
  path: string;
  visitorHash: string;
  referer?: string;
  userAgent?: string;
  country?: string;
}

/**
 * Database record for interaction events (clicks and time-on-page).
 * These are stored in the events table, separate from page views.
 * Note: does not include 'page_view' type since those use VisitRecord.
 */
export interface EventRecord {
  type: 'click' | 'time_on_page';
  path: string;
  visitorHash?: string;
  elementTag?: string;
  elementId?: string;
  elementText?: string;
  href?: string;
  duration?: number;
}

/**
 * Aggregated statistics types for analytics dashboard
 */

export interface DailyStats {
  date: string;
  visits: number;
  uniqueVisitors: number;
  events: number;
}

export interface TopPage {
  path: string;
  visits: number;
  uniqueVisitors: number;
}

export interface TopReferer {
  referer: string;
  visits: number;
}
