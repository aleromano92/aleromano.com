export type BrowserLabel = 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Opera' | 'Other';
export type OSLabel = 'iOS' | 'Android' | 'macOS' | 'Windows' | 'Linux' | 'Other';

export interface ParsedUserAgent {
  browser: BrowserLabel | null;
  os: OSLabel | null;
}

export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent {
  if (!ua) return { browser: null, os: null };

  let os: OSLabel = 'Other';
  if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Macintosh|Mac OS X/.test(ua)) os = 'macOS';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Linux/.test(ua)) os = 'Linux';

  let browser: BrowserLabel = 'Other';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Safari\//.test(ua)) browser = 'Safari';

  return { browser, os };
}
