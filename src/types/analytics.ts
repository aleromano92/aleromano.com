/**
 * Analytics event types shared between client and server
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
 * Database record types for analytics
 */

export interface VisitRecord {
  path: string;
  visitorHash: string;
  referer?: string;
  userAgent?: string;
  country?: string;
}

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
