import type { APIRoute } from 'astro';
import { analyticsManager, generateVisitorHash } from '../../../utils/database';
import type { AnalyticsEvent } from '../../../types/analytics';
import { ANALYTICS_ELEMENT_TEXT_MAX_LENGTH } from '../../../utils/constants';

/**
 * Extract client IP from request headers (behind nginx proxy)
 */
function getClientIP(request: Request): string {
  const realIP = request.headers.get('X-Real-IP');
  if (realIP) return realIP;

  const forwardedFor = request.headers.get('X-Forwarded-For');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  console.warn('[Analytics API] Missing X-Real-IP and X-Forwarded-For headers; using fallback IP value "unknown" for analytics.');
  return 'unknown';
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json() as AnalyticsEvent;

    // Validate required fields
    if (!payload.type || !payload.path) {
      return new Response(JSON.stringify({ error: 'Missing required fields: type, path' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate event type
    const validTypes = ['page_view', 'click', 'time_on_page'];
    if (!validTypes.includes(payload.type)) {
      return new Response(JSON.stringify({ error: 'Invalid event type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle page_view separately - insert into visits table
    if (payload.type === 'page_view') {
      const ip = getClientIP(request);
      const userAgent = request.headers.get('User-Agent') || 'unknown';
      const visitorHash = generateVisitorHash(ip, userAgent);

      analyticsManager.recordVisit({
        path: payload.path,
        visitorHash,
        referer: payload.referer,
        userAgent,
      });
    } else {
      // Queue click/time_on_page events for batched insertion
      analyticsManager.queueEvent({
        type: payload.type,
        path: payload.path,
        elementTag: payload.elementTag,
        elementId: payload.elementId,
        elementText: payload.elementText?.slice(0, ANALYTICS_ELEMENT_TEXT_MAX_LENGTH),
        href: payload.href,
        duration: payload.duration,
      });
      
      // Return 202 Accepted since the event is queued but not yet processed
      return new Response(JSON.stringify({ success: true, queued: true }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Analytics API] Error processing event:', error);
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Reject other methods
export const ALL: APIRoute = () => {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
};
