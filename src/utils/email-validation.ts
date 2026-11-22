import { resolveMx } from 'node:dns/promises';

const MAX_EMAIL_TOTAL_LENGTH = 254;
const DOMAIN_LABEL = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

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
