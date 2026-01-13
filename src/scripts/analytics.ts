/**
 * Client-side analytics tracking for page views, clicks, and time-on-page.
 * This script is lightweight and uses fetch with keepalive for reliability.
 */

import type { AnalyticsEvent } from '../types/analytics';
import { MIN_TIME_ON_PAGE_MS } from '../utils/constants';

// Extend Navigator interface to include Global Privacy Control
// GPC is a modern privacy signal supported by some browsers
// See: https://globalprivacycontrol.org/
interface NavigatorWithGPC extends Navigator {
  globalPrivacyControl?: boolean;
}

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
    const elementText = target.textContent?.trim() || undefined;
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
 * Check if the user has enabled privacy preferences that opt out of tracking.
 * Supports both Do Not Track (DNT) and Global Privacy Control (GPC).
 * 
 * DNT is deprecated but still widely used; it can return '1', 'yes', or null across browsers.
 * GPC is the modern standard for user privacy signals.
 * 
 * Exported for testing purposes.
 */
export function shouldRespectPrivacy(): boolean {
  // Check Global Privacy Control (modern standard)
  const nav = navigator as NavigatorWithGPC;
  if (nav.globalPrivacyControl === true) {
    return true;
  }

  // Check Do Not Track (deprecated but still widely used)
  // Different browsers return different values: '1', 'yes', or null
  const dnt = navigator.doNotTrack;
  if (dnt === '1' || dnt === 'yes') {
    return true;
  }

  return false;
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

  // Don't track if user has enabled privacy preferences
  if (shouldRespectPrivacy()) {
    console.log('[Analytics] Respecting user privacy preferences (DNT or GPC)');
    return;
  }

  // Track page view immediately
  sendPageView();

  // Set up interaction tracking
  initClickTracking();
  initTimeTracking();
}
