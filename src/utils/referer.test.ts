import { describe, it, expect } from 'vitest';
import { normalizeReferer } from './referer';

describe('normalizeReferer', () => {
  it('returns null for missing inputs', () => {
    expect(normalizeReferer(null)).toBeNull();
    expect(normalizeReferer(undefined)).toBeNull();
    expect(normalizeReferer('')).toBeNull();
  });

  it('strips query string and fragment but keeps the path', () => {
    expect(normalizeReferer('https://google.com/search?q=secret+query')).toBe('https://google.com/search');
    expect(normalizeReferer('https://linkedin.com/feed/post/123?utm_source=x')).toBe('https://linkedin.com/feed/post/123');
    expect(normalizeReferer('https://example.com/path/to/page#section')).toBe('https://example.com/path/to/page');
  });

  it('collapses a lone "/" so bare-origin variants bucket together', () => {
    expect(normalizeReferer('https://google.com/')).toBe('https://google.com');
    expect(normalizeReferer('https://google.com')).toBe('https://google.com');
    expect(normalizeReferer('https://google.com/?utm=x')).toBe('https://google.com');
  });

  it('preserves trailing slashes on real paths', () => {
    expect(normalizeReferer('https://example.com/path/')).toBe('https://example.com/path/');
  });

  it('preserves the port when present', () => {
    expect(normalizeReferer('https://localhost:3000/admin?token=abc')).toBe('https://localhost:3000/admin');
  });

  it('preserves the scheme', () => {
    expect(normalizeReferer('http://example.com/x')).toBe('http://example.com/x');
    expect(normalizeReferer('https://example.com/x')).toBe('https://example.com/x');
  });

  it('is idempotent', () => {
    expect(normalizeReferer('https://google.com/search')).toBe('https://google.com/search');
    expect(normalizeReferer('https://example.com:8080')).toBe('https://example.com:8080');
  });

  it('returns null for unparseable inputs', () => {
    expect(normalizeReferer('not a url')).toBeNull();
    expect(normalizeReferer('::: invalid :::')).toBeNull();
  });
});
