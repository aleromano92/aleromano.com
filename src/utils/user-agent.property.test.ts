import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { parseUserAgent } from './user-agent';

const BROWSERS = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera', 'Other'];
const OSES = ['iOS', 'Android', 'macOS', 'Windows', 'Linux', 'Other'];

describe('parseUserAgent properties', () => {
  it('always returns labels from the allowed low-cardinality sets (or null)', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.string({ unit: 'binary' }), fc.constantFrom(null, undefined)), (ua) => {
        const { browser, os } = parseUserAgent(ua);
        const browserOk = browser === null || BROWSERS.includes(browser);
        const osOk = os === null || OSES.includes(os);
        return browserOk && osOk;
      })
    );
  });

  it('returns both-null only for empty/nullish input, never partial null otherwise', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (ua) => {
        const { browser, os } = parseUserAgent(ua);
        // A non-empty UA always yields concrete labels (defaulting to 'Other').
        return browser !== null && os !== null;
      })
    );
  });

  it('treats empty and nullish input as unknown (both null)', () => {
    for (const input of ['', null, undefined]) {
      expect(parseUserAgent(input)).toEqual({ browser: null, os: null });
    }
  });
});
