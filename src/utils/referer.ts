export function normalizeReferer(referer: string | null | undefined): string | null {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    const path = url.pathname === '/' ? '' : url.pathname;
    return url.origin + path;
  } catch {
    return null;
  }
}
