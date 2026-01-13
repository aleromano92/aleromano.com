export const BLOG_POSTS_PATH = '/posts' as const;

/**
 * Maximum length for element text captured in analytics click events.
 * Applied both client-side (before sending) and server-side (validation).
 */
export const ANALYTICS_ELEMENT_TEXT_MAX_LENGTH = 50 as const;

/**
 * Minimum time (in milliseconds) a user must spend on a page before
 * a time-on-page event is tracked. This filters out accidental clicks
 * and bot traffic, ensuring only meaningful engagement is recorded.
 */
export const MIN_TIME_ON_PAGE_MS = 1000 as const; 