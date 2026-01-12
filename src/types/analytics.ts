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
