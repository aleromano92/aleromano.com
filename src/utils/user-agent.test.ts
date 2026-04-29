import { describe, it, expect } from 'vitest';
import { parseUserAgent } from './user-agent';

describe('parseUserAgent', () => {
  it('returns nulls for missing UA', () => {
    expect(parseUserAgent(undefined)).toEqual({ browser: null, os: null });
    expect(parseUserAgent(null)).toEqual({ browser: null, os: null });
    expect(parseUserAgent('')).toEqual({ browser: null, os: null });
  });

  it('detects macOS Safari', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
    expect(parseUserAgent(ua)).toEqual({ browser: 'Safari', os: 'macOS' });
  });

  it('detects macOS Chrome', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    expect(parseUserAgent(ua)).toEqual({ browser: 'Chrome', os: 'macOS' });
  });

  it('detects Windows Edge', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
    expect(parseUserAgent(ua)).toEqual({ browser: 'Edge', os: 'Windows' });
  });

  it('detects Windows Firefox', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0';
    expect(parseUserAgent(ua)).toEqual({ browser: 'Firefox', os: 'Windows' });
  });

  it('detects iPhone Safari', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    expect(parseUserAgent(ua)).toEqual({ browser: 'Safari', os: 'iOS' });
  });

  it('detects Android Chrome', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
    expect(parseUserAgent(ua)).toEqual({ browser: 'Chrome', os: 'Android' });
  });

  it('detects Linux Firefox', () => {
    const ua = 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0';
    expect(parseUserAgent(ua)).toEqual({ browser: 'Firefox', os: 'Linux' });
  });

  it('detects Opera', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0';
    expect(parseUserAgent(ua)).toEqual({ browser: 'Opera', os: 'Windows' });
  });

  it('falls back to Other for unrecognized strings', () => {
    expect(parseUserAgent('curl/8.0.0')).toEqual({ browser: 'Other', os: 'Other' });
    expect(parseUserAgent('SomeBot/1.0 (Macintosh)')).toEqual({ browser: 'Other', os: 'macOS' });
  });
});
