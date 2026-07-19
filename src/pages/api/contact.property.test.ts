import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';

// Same nodemailer mock as contact.test.ts so no real mail is sent.
const { mockSendMail, mockCreateTransport, mockCreateTestAccount, mockGetTestMessageUrl } = vi.hoisted(() => {
  const sendMail = vi.fn();
  return {
    mockSendMail: sendMail,
    mockCreateTransport: vi.fn(() => ({ sendMail })),
    mockCreateTestAccount: vi.fn(),
    mockGetTestMessageUrl: vi.fn(),
  };
});

vi.mock('nodemailer', () => ({
  default: {
    createTransport: mockCreateTransport,
    createTestAccount: mockCreateTestAccount,
    getTestMessageUrl: mockGetTestMessageUrl,
  },
}));

import { POST } from './contact';

const ORIGINAL_ENV = { ...process.env };
const ALLOWED_STATUSES = new Set([200, 400, 413, 500]);

function call(body: string, contentType = 'application/json') {
  const request = new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body,
  });
  return POST({ request } as Parameters<typeof POST>[0]);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSendMail.mockResolvedValue({ messageId: '<id>' });
  mockCreateTestAccount.mockResolvedValue({ user: 'u', pass: 'p' });
  process.env.SMTP_HOST = 'smtp-relay';
  process.env.SMTP_PORT = '25';
  process.env.ALE_PERSONAL_EMAIL = 'ale@example.com';
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

/**
 * Fault injection on the input boundary: throw arbitrary payloads at the
 * endpoint and assert its residues survive — it never crashes, always answers
 * with a sane HTTP status, and never sends mail unless it returns 200.
 */
describe('POST /api/contact fuzzing', () => {
  it('always returns a Response with an allowed status for arbitrary JSON payloads', async () => {
    await fc.assert(
      fc.asyncProperty(fc.jsonValue(), async (payload) => {
        const res = await call(JSON.stringify(payload));
        expect(res).toBeInstanceOf(Response);
        expect(ALLOWED_STATUSES.has(res.status)).toBe(true);
      })
    );
  });

  it('never throws on arbitrary (often non-JSON) raw bodies', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (raw) => {
        const res = await call(raw);
        expect(res).toBeInstanceOf(Response);
        expect(ALLOWED_STATUSES.has(res.status)).toBe(true);
      })
    );
  });

  it('only sends mail when it answers 200 (no mail for rejected input)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.jsonValue(), async (payload) => {
        mockSendMail.mockClear();
        const res = await call(JSON.stringify(payload));
        if (res.status !== 200) {
          expect(mockSendMail).not.toHaveBeenCalled();
        }
      })
    );
  });

  it('never accepts a payload lacking a genuine Form Token (anti-bot residue)', async () => {
    // fc cannot forge an HMAC over the process secret, so no generated payload
    // may ever reach the mailer — the tripwires must catch every one.
    await fc.assert(
      fc.asyncProperty(fc.jsonValue(), async (payload) => {
        mockSendMail.mockClear();
        const res = await call(JSON.stringify(payload));
        expect(res.status).not.toBe(200);
        expect(mockSendMail).not.toHaveBeenCalled();
      })
    );
  });
});
