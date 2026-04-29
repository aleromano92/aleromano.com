/**
 * Coarse User-Agent parser.
 *
 * Returns low-cardinality browser / OS labels (≤ ~6 distinct values per axis)
 * suitable for analytics aggregation without retaining the raw fingerprintable
 * UA string. Returns null when nothing reasonable can be inferred.
 */

export type BrowserLabel = 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Opera' | 'Other';
export type OSLabel = 'iOS' | 'Android' | 'macOS' | 'Windows' | 'Linux' | 'Other';

export interface ParsedUserAgent {
  browser: BrowserLabel | null;
  os: OSLabel | null;
}

export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent {
  if (!ua) return { browser: null, os: null };

  // OS detection — order matters: iOS/Android must precede macOS/Linux.
  let os: OSLabel = 'Other';
  if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Macintosh|Mac OS X/.test(ua)) os = 'macOS';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Linux/.test(ua)) os = 'Linux';

  // Browser detection — order matters: Edge/Opera before Chrome, Chrome before Safari.
  let browser: BrowserLabel = 'Other';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Safari\//.test(ua)) browser = 'Safari';

  return { browser, os };
}
