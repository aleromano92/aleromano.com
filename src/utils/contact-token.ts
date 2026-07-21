import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Anti-bot Form Token: an HMAC-signed timestamp proving the sender fetched it
 * from this site and waited a human-plausible interval before submitting.
 *
 * Deliberately stateless and replayable within its window — nginx rate limiting
 * caps abuse. See docs/adr/0001-stateless-fail-open-contact-form-defenses.md.
 *
 * The secret is ephemeral (regenerated per process start), so a deploy
 * invalidates outstanding tokens. The form heals by refetching and retrying.
 * Assumes a single Node process.
 */
const SECRET = randomBytes(32);

/** Humans need at least a few seconds to type a message; bots submit instantly. */
export const TOKEN_MIN_AGE_MS = 3_000;
export const TOKEN_MAX_AGE_MS = 60 * 60 * 1_000;

const SIGNATURE_HEX_LENGTH = 64; // HMAC-SHA256

export type TokenVerification =
  | { valid: true }
  | { valid: false; reason: 'malformed' | 'bad-signature' | 'too-young' | 'too-old' };

function sign(timestamp: string): Buffer {
  return createHmac('sha256', SECRET).update(timestamp).digest();
}

export function issueToken(now: number = Date.now()): string {
  return `${now}.${sign(String(now)).toString('hex')}`;
}

export function verifyToken(token: string, now: number = Date.now()): TokenVerification {
  const separator = token.indexOf('.');
  if (separator === -1) return { valid: false, reason: 'malformed' };

  const timestampPart = token.slice(0, separator);
  const signaturePart = token.slice(separator + 1);

  if (!/^\d+$/.test(timestampPart) || signaturePart.length !== SIGNATURE_HEX_LENGTH || !/^[0-9a-f]+$/.test(signaturePart)) {
    return { valid: false, reason: 'malformed' };
  }

  const expected = sign(timestampPart);
  const provided = Buffer.from(signaturePart, 'hex');
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return { valid: false, reason: 'bad-signature' };
  }

  const age = now - Number(timestampPart);
  if (age < TOKEN_MIN_AGE_MS) return { valid: false, reason: 'too-young' };
  if (age > TOKEN_MAX_AGE_MS) return { valid: false, reason: 'too-old' };

  return { valid: true };
}
