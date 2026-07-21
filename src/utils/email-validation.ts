import { resolveMx } from 'node:dns/promises';

/**
 * Email checks exist to catch Human Mistakes (typos), not bots — a bot can
 * trivially supply a deliverable address. Callers must treat DNS uncertainty
 * as acceptance (fail open): rejecting a possibly-real Lead is worse than
 * admitting Noise. See docs/adr/0001-stateless-fail-open-contact-form-defenses.md.
 */

const MAX_EMAIL_TOTAL_LENGTH = 254;
const DOMAIN_LABEL = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

/**
 * Pragmatic syntax check for local@domain.tld — intentionally stricter than
 * RFC 5322 (no quoted locals, no IP domains): those never come from humans
 * typing their own address, while `name@gmailcom` does.
 */
export function isPlausibleEmail(email: string): boolean {
  if (!email || email.length > MAX_EMAIL_TOTAL_LENGTH) return false;

  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1 || email.indexOf('@') !== atIndex) return false;

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);

  if (!local || /\s/.test(local)) return false;

  const labels = domain.split('.');
  if (labels.length < 2) return false;
  if (!labels.every((label) => DOMAIN_LABEL.test(label))) return false;

  const tld = labels[labels.length - 1];
  return tld.length >= 2;
}

/**
 * True when the email's domain publishes MX records. Definitive negatives
 * (domain missing, no MX) reject; anything uncertain — resolver errors,
 * slow DNS — accepts.
 */
export async function domainAcceptsMail(email: string, timeoutMs = 2_000): Promise<boolean> {
  const domain = email.slice(email.lastIndexOf('@') + 1);

  const DNS_UNCERTAIN = Symbol('dns-uncertain');
  let timerId!: ReturnType<typeof setTimeout>;
  const timeout = new Promise<typeof DNS_UNCERTAIN>((resolve) => {
    timerId = setTimeout(() => resolve(DNS_UNCERTAIN), timeoutMs);
  });

  try {
    const records = await Promise.race([resolveMx(domain), timeout]);
    if (records === DNS_UNCERTAIN) return true;
    return records.length > 0;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return code !== 'ENOTFOUND' && code !== 'ENODATA';
  } finally {
    clearTimeout(timerId);
  }
}
