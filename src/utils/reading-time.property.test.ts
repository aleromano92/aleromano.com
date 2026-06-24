import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { stripHtmlToPlainText, getReadingTime } from './reading-time';

/**
 * Property-based (residuality) tests: instead of a handful of examples, subject
 * the functions to a wide space of random "stressor" strings and assert the
 * invariants ("residues") that must survive every input.
 */
describe('reading-time properties', () => {
  it('getReadingTime always returns a whole number of at least 1 minute', () => {
    fc.assert(
      fc.property(fc.string(), (content) => {
        const minutes = getReadingTime(content);
        return Number.isInteger(minutes) && minutes >= 1;
      })
    );
  });

  it('getReadingTime never throws and never returns NaN, even for unicode/whitespace', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.string({ unit: 'binary' }), fc.constantFrom('', '   ', '\n\t')), (content) => {
        expect(Number.isFinite(getReadingTime(content))).toBe(true);
      })
    );
  });

  it('stripHtmlToPlainText returns a string with no complete HTML tags remaining', () => {
    fc.assert(
      fc.property(fc.string(), (content) => {
        const out = stripHtmlToPlainText(content);
        return typeof out === 'string' && !/<[^>]+>/.test(out);
      })
    );
  });

  it('stripHtmlToPlainText output is trimmed (no leading/trailing whitespace)', () => {
    fc.assert(
      fc.property(fc.string(), (content) => {
        const out = stripHtmlToPlainText(content);
        return out === out.trim();
      })
    );
  });
});
