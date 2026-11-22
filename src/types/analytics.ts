export interface AnalyticsEvent {
  type: 'page_view' | 'click' | 'time_on_page' | 'ai_feature';
  path: string;
  referer?: string;
  elementTag?: string;
  elementId?: string;
  elementText?: string;
  href?: string;
  duration?: number;
}

export interface VisitRecord {
  path: string;
  visitorHash: string;
  referer?: string;
  browser?: string | null;
  os?: string | null;
  country?: string;
}

export interface EventRecord {
  type: 'click' | 'time_on_page' | 'ai_feature';
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

export interface CountryStats {
  country: string;
  visits: number;
  uniqueVisitors: number;
}

export interface BrowserStats {
  browser: string;
  visits: number;
  uniqueVisitors: number;
}

export interface OSStats {
  os: string;
  visits: number;
  uniqueVisitors: number;
}

export interface EventTypeBreakdown {
  type: string;
  count: number;
}
