import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockResolveMx } = vi.hoisted(() => ({ mockResolveMx: vi.fn() }));

vi.mock('node:dns/promises', () => ({
  resolveMx: mockResolveMx,
}));

import { isPlausibleEmail, domainAcceptsMail } from './email-validation';

function dnsError(code: string): Error & { code: string } {
  return Object.assign(new Error(code), { code });
}

describe('isPlausibleEmail', () => {
  it.each([
    'jane@example.com',
    'jane.doe+tag@example.co.uk',
    'u.lu.wafa.ju97@gmail.com',
    'name_with-chars@sub.domain.dev',
  ])('accepts %s', (email) => {
    expect(isPlausibleEmail(email)).toBe(true);
  });

  it.each([
    ['missing @', 'janeexample.com'],
    ['two @', 'jane@doe@example.com'],
    ['missing TLD (typo like gmailcom)', 'jane@gmailcom'],
    ['empty local part', '@example.com'],
    ['empty domain', 'jane@'],
    ['space inside', 'jane doe@example.com'],
    ['empty domain label', 'jane@example..com'],
    ['trailing dot in domain', 'jane@example.com.'],
    ['label starting with hyphen', 'jane@-example.com'],
    ['single-char TLD', 'jane@example.c'],
    ['empty string', ''],
  ])('rejects %s: %s', (_label, email) => {
    expect(isPlausibleEmail(email)).toBe(false);
  });

  it('rejects addresses longer than 254 characters', () => {
    const email = `${'a'.repeat(250)}@example.com`;
    expect(isPlausibleEmail(email)).toBe(false);
  });
});

describe('domainAcceptsMail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts when the domain has MX records', async () => {
    mockResolveMx.mockResolvedValue([{ exchange: 'mx.example.com', priority: 10 }]);

    await expect(domainAcceptsMail('jane@example.com')).resolves.toBe(true);
    expect(mockResolveMx).toHaveBeenCalledWith('example.com');
  });

  it('rejects when the domain does not exist (typo like gmali.com)', async () => {
    mockResolveMx.mockRejectedValue(dnsError('ENOTFOUND'));

    await expect(domainAcceptsMail('jane@gmali.com')).resolves.toBe(false);
  });

  it('rejects when the domain exists but has no MX records', async () => {
    mockResolveMx.mockRejectedValue(dnsError('ENODATA'));

    await expect(domainAcceptsMail('jane@no-mail.example')).resolves.toBe(false);
  });

  it('rejects when the resolver returns an empty MX list', async () => {
    mockResolveMx.mockResolvedValue([]);

    await expect(domainAcceptsMail('jane@no-mail.example')).resolves.toBe(false);
  });

  it('fails open on other DNS failures (never lose a Lead to DNS trouble)', async () => {
    mockResolveMx.mockRejectedValue(dnsError('SERVFAIL'));

    await expect(domainAcceptsMail('jane@example.com')).resolves.toBe(true);
  });

  it('fails open when DNS is slower than the timeout', async () => {
    mockResolveMx.mockImplementation(() => new Promise(() => {}));

    await expect(domainAcceptsMail('jane@example.com', 50)).resolves.toBe(true);
  });
});
