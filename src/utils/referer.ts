/**
 * Normalize a referer to scheme + host + port + path, stripping query string
 * and fragment. The path is preserved because it carries useful context
 * (e.g. /feed vs /pulse on LinkedIn) without the personal-data risk of query
 * strings (search terms, session tokens, user IDs). A lone "/" is dropped so
 * that "https://x.com" and "https://x.com/" bucket together. Returns null for
 * missing, empty, or unparseable inputs.
 */
export function normalizeReferer(referer: string | null | undefined): string | null {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    const path = url.pathname === '/' ? '' : url.pathname;
    return url.origin + path;
  } catch {
    return null;
  }
}
