import { describe, it, expect } from 'vitest';
import { issueToken, verifyToken, TOKEN_MIN_AGE_MS, TOKEN_MAX_AGE_MS } from './contact-token';

const ISSUED_AT = 1_700_000_000_000;

describe('contact form token', () => {
  it('accepts its own token once the minimum age has passed', () => {
    const token = issueToken(ISSUED_AT);

    const result = verifyToken(token, ISSUED_AT + TOKEN_MIN_AGE_MS);

    expect(result).toEqual({ valid: true });
  });

  it('rejects a token younger than the minimum age (bots submit instantly)', () => {
    const token = issueToken(ISSUED_AT);

    const result = verifyToken(token, ISSUED_AT + TOKEN_MIN_AGE_MS - 1);

    expect(result).toEqual({ valid: false, reason: 'too-young' });
  });

  it('rejects a token older than the maximum age (stale or replayed much later)', () => {
    const token = issueToken(ISSUED_AT);

    const result = verifyToken(token, ISSUED_AT + TOKEN_MAX_AGE_MS + 1);

    expect(result).toEqual({ valid: false, reason: 'too-old' });
  });

  it('rejects a token whose timestamp was tampered with', () => {
    const token = issueToken(ISSUED_AT);
    const [, signature] = token.split('.');
    const forged = `${ISSUED_AT - 60_000}.${signature}`;

    const result = verifyToken(forged, ISSUED_AT);

    expect(result).toEqual({ valid: false, reason: 'bad-signature' });
  });

  it('rejects a token with a forged signature', () => {
    const token = issueToken(ISSUED_AT);
    const [timestamp, signature] = token.split('.');
    const flipped = (signature[0] === 'a' ? 'b' : 'a') + signature.slice(1);

    const result = verifyToken(`${timestamp}.${flipped}`, ISSUED_AT + TOKEN_MIN_AGE_MS);

    expect(result).toEqual({ valid: false, reason: 'bad-signature' });
  });

  it.each([
    ['empty string', ''],
    ['no separator', 'abcdef'],
    ['non-numeric timestamp', 'notanumber.deadbeef'],
    ['missing signature', '1700000000000.'],
    ['signature of wrong length', '1700000000000.deadbeef'],
  ])('rejects a malformed token: %s', (_label, malformed) => {
    const result = verifyToken(malformed, ISSUED_AT);

    expect(result).toEqual({ valid: false, reason: 'malformed' });
  });

  it('rejects a token dated in the future (forged timestamp cannot skip the wait)', () => {
    const token = issueToken(ISSUED_AT + 60_000);

    const result = verifyToken(token, ISSUED_AT);

    expect(result).toEqual({ valid: false, reason: 'too-young' });
  });

  it('issues distinct tokens for distinct timestamps', () => {
    expect(issueToken(ISSUED_AT)).not.toBe(issueToken(ISSUED_AT + 1));
  });
});
