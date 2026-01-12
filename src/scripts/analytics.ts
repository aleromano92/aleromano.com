/**
 * Client-side analytics tracking for page views, clicks, and time-on-page.
 * This script is lightweight and uses fetch with keepalive for reliability.
 */

import type { AnalyticsEvent } from '../types/analytics';
import { ANALYTICS_ELEMENT_TEXT_MAX_LENGTH, MIN_TIME_ON_PAGE_MS } from '../utils/constants';

const ANALYTICS_ENDPOINT = '/api/analytics/collect';

/**
 * Send analytics data to the server.
 * Uses keepalive to ensure data is sent even when the page is closing.
 */
function sendEvent(event: AnalyticsEvent): void {
  try {
    fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(event),
      headers: { 'Content-Type': 'application/json' },
      keepalive: true, // Ensures request completes even if tab closes
    }).catch(() => {
      // Silently fail - analytics should never break the user experience
    });
  } catch {
    // Silently fail
  }
}

/**
 * Send a page view event immediately on page load.
 * Includes referer for traffic source analysis.
 */
function sendPageView(): void {
  sendEvent({
    type: 'page_view',
    path: window.location.pathname,
    referer: document.referrer || undefined,
  });
}

/**
 * Initialize click tracking using event delegation.
 * Only tracks clicks on interactive elements (links, buttons).
 */
function initClickTracking(): void {
  document.addEventListener('click', (e: MouseEvent) => {
    // Narrow EventTarget to Element before using closest; click targets are non-null in practice
    if (!(e.target instanceof Element)) return;

    const target = e.target.closest('a, button');
    if (!target) return;

    const elementTag = target.tagName.toLowerCase();
    const elementId = target.id || undefined;
    const elementText = (target as HTMLElement).innerText?.trim().slice(0, ANALYTICS_ELEMENT_TEXT_MAX_LENGTH) || undefined;
    const href = (target as HTMLAnchorElement).href || undefined;

    sendEvent({
      type: 'click',
      path: window.location.pathname,
      elementTag,
      elementId,
      elementText,
      href,
    });
  });
}

/**
 * Initialize time-on-page tracking.
 * Uses the Page Visibility API for reliable tracking on mobile devices.
 */
function initTimeTracking(): void {
  const startTime = performance.now();
  let hasSentDuration = false;

  const sendDuration = (): void => {
    if (hasSentDuration) return;
    hasSentDuration = true;

    const duration = Math.round(performance.now() - startTime);
    
    // Only send if user spent meaningful time on the page
    if (duration < MIN_TIME_ON_PAGE_MS) return;

    sendEvent({
      type: 'time_on_page',
      path: window.location.pathname,
      duration,
    });
  };

  // Visibility change is more reliable than beforeunload on mobile
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendDuration();
    }
  });

  // Fallback for desktop browsers
  window.addEventListener('pagehide', sendDuration);
}

/**
 * Initialize all analytics tracking.
 * Call this from your main layout.
 */
export function initAnalytics(): void {
  // Don't track in development mode
  if (import.meta.env.DEV) {
    console.log('[Analytics] Disabled in development mode');
    return;
  }

  // Don't track if Do Not Track is enabled (respecting user privacy)
  if (navigator.doNotTrack === '1') {
    console.log('[Analytics] Respecting Do Not Track preference');
    return;
  }

  // Track page view immediately
  sendPageView();

  // Set up interaction tracking
  initClickTracking();
  initTimeTracking();
}
