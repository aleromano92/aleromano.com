import type { AnalyticsEvent } from '../types/analytics';
import { MIN_TIME_ON_PAGE_MS } from '../utils/constants';

interface NavigatorWithGPC extends Navigator {
  globalPrivacyControl?: boolean;
}

const ANALYTICS_ENDPOINT = '/api/analytics/collect';

function sendEvent(event: AnalyticsEvent): void {
  try {
    fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(event),
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {
    });
  } catch {
  }
}

function sendPageView(): void {
  sendEvent({
    type: 'page_view',
    path: window.location.pathname,
    referer: document.referrer || undefined,
  });
}

function initClickTracking(): void {
  document.addEventListener('click', (e: MouseEvent) => {
    if (!(e.target instanceof Element)) return;

    const target = e.target.closest('a, button');
    if (!target) return;

    const elementTag = target.tagName.toLowerCase();
    const elementId = target.id || undefined;
    const elementText = target.textContent?.trim() || undefined;
    const href =
      target instanceof HTMLAnchorElement ? target.href || undefined : undefined;

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

function initTimeTracking(): void {
  const startTime = performance.now();
  let hasSentDuration = false;

  const sendDuration = (): void => {
    if (hasSentDuration) return;
    hasSentDuration = true;

    const duration = Math.round(performance.now() - startTime);
    
    if (duration < MIN_TIME_ON_PAGE_MS) return;

    sendEvent({
      type: 'time_on_page',
      path: window.location.pathname,
      duration,
    });
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendDuration();
    }
  });

  window.addEventListener('pagehide', sendDuration);
}

export function shouldRespectPrivacy(): boolean {
  const nav = navigator as NavigatorWithGPC;
  if (nav.globalPrivacyControl === true) {
    return true;
  }

  const dnt = navigator.doNotTrack;
  if (dnt === '1' || dnt === 'yes') {
    return true;
  }

  return false;
}

export function trackEvent(event: AnalyticsEvent): void {
  if (import.meta.env.DEV) return;
  if (shouldRespectPrivacy()) return;
  sendEvent(event);
}

export function initAnalytics(): void {
  if (import.meta.env.DEV) {
    console.log('[Analytics] Disabled in development mode');
    return;
  }

  if (shouldRespectPrivacy()) {
    console.log('[Analytics] Respecting user privacy preferences (DNT or GPC)');
    return;
  }

  sendPageView();

  initClickTracking();
  initTimeTracking();
}
