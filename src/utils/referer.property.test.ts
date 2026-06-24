import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { normalizeReferer } from './referer';

describe('normalizeReferer properties', () => {
  it('never throws and returns either null or a string for any input', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.constantFrom(null, undefined)), (input) => {
        const out = normalizeReferer(input);
        return out === null || typeof out === 'string';
      })
    );
  });

  it('strips query string and fragment from any valid URL', () => {
    fc.assert(
      fc.property(fc.webUrl({ withQueryParameters: true, withFragments: true }), (url) => {
        const out = normalizeReferer(url);
        // A valid URL always normalizes to a non-null origin+path with no ? or #.
        return out !== null && !out.includes('?') && !out.includes('#');
      })
    );
  });

  it('is idempotent: normalizing an already-normalized referer is a no-op', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const once = normalizeReferer(input);
        if (once === null) return true;
        expect(normalizeReferer(once)).toBe(once);
        return true;
      })
    );
  });
});
