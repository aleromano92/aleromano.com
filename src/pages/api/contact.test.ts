import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock nodemailer before importing the route under test.
// contact.ts uses the default export: nodemailer.createTransport / createTestAccount / getTestMessageUrl.
// vi.hoisted is required because vi.mock is hoisted above these declarations.
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

// Real DNS has no place in unit tests: the MX check sees a well-published domain.
const { mockResolveMx } = vi.hoisted(() => ({ mockResolveMx: vi.fn() }));
vi.mock('node:dns/promises', () => ({ resolveMx: mockResolveMx }));

import { POST } from './contact';
import { issueToken, TOKEN_MIN_AGE_MS } from '../../utils/contact-token';

const RECIPIENT = 'ale@example.com';

/** A token old enough to clear the minimum-age check right now. */
function matureToken(): string {
  return issueToken(Date.now() - TOKEN_MIN_AGE_MS);
}

// Object bodies get a valid Form Token unless the test supplies its own.
function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  const withToken =
    body !== null && typeof body === 'object' && !('token' in body) ? { token: matureToken(), ...body } : body;
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof withToken === 'string' ? withToken : JSON.stringify(withToken),
  });
}

function call(request: Request) {
  // The route only uses `request` from the APIContext.
  return POST({ request } as Parameters<typeof POST>[0]);
}

// `website` is the Honeypot: honest clients always send it empty.
const validPayload = {
  reason: 'general',
  name: 'Jane Doe',
  email: 'jane@external.com',
  message: 'Hello there\nsecond line',
  website: '',
};

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  mockSendMail.mockResolvedValue({ messageId: '<test-message-id>' });
  mockCreateTestAccount.mockResolvedValue({ user: 'ethereal-user', pass: 'ethereal-pass' });
  mockGetTestMessageUrl.mockReturnValue('https://ethereal.email/message/preview');
  mockResolveMx.mockResolvedValue([{ exchange: 'mx.external.com', priority: 10 }]);
  // Production-like config: route through the internal relay, not Ethereal.
  process.env.SMTP_HOST = 'smtp-relay';
  process.env.SMTP_PORT = '25';
  process.env.ALE_PERSONAL_EMAIL = RECIPIENT;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('POST /api/contact', () => {
  describe('email sending (smtp-relay path)', () => {
    it('sends the email through the relay transport and returns 200', async () => {
      const response = await call(makeRequest(validPayload));

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);

      // Relay transport, not the Ethereal fallback.
      expect(mockCreateTestAccount).not.toHaveBeenCalled();
      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({ host: 'smtp-relay', port: 25, secure: false })
      );
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it('builds mail options with recipient, reply-to and subject from the submission', async () => {
      await call(makeRequest(validPayload));

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.to).toBe(RECIPIENT);
      expect(mailOptions.replyTo).toBe(validPayload.email);
      // From must be a well-formed address: "Name via aleromano.com" <recipient>
      expect(mailOptions.from).toBe(`"${validPayload.name} via aleromano.com" <${RECIPIENT}>`);
      expect(mailOptions.subject).toBe('Contact Form: general');
      expect(mailOptions.text).toContain(validPayload.message);
      expect(mailOptions.html).toContain('Hello there<br>second line');
    });

    it('includes the blog post title in the subject when provided', async () => {
      await call(makeRequest({ ...validPayload, reason: 'blogpost', blogPostTitle: 'My Post' }));

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.subject).toBe('Contact Form: blogpost - My Post');
    });

    it('returns 500 and does not leak the error when sendMail rejects', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP connection refused'));

      const response = await call(makeRequest(validPayload));

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.message).toBe('Failed to send message. Please try again later.');
    });
  });

  describe('Ethereal fallback path', () => {
    it('creates a test account and uses Ethereal when SMTP_HOST is not the relay', async () => {
      process.env.SMTP_HOST = '';

      const response = await call(makeRequest(validPayload));

      expect(response.status).toBe(200);
      expect(mockCreateTestAccount).toHaveBeenCalledTimes(1);
      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({ host: 'smtp.ethereal.email', port: 587 })
      );
      expect(mockGetTestMessageUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe('configuration errors', () => {
    it('returns 500 without sending when the recipient env var is missing', async () => {
      delete process.env.ALE_PERSONAL_EMAIL;

      const response = await call(makeRequest(validPayload));

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.message).toContain('Server configuration error');
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

  describe('request validation (no email is sent)', () => {
    it('rejects a non-JSON content type with 400', async () => {
      const response = await call(makeRequest(validPayload, { 'Content-Type': 'text/plain' }));

      expect(response.status).toBe(400);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('rejects an unknown contact reason with 400', async () => {
      const response = await call(makeRequest({ ...validPayload, reason: 'spam' }));

      expect(response.status).toBe(400);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('rejects a submission missing required fields with 400 listing them', async () => {
      const response = await call(makeRequest({ reason: 'general', name: '', email: '', message: '', website: '' }));

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.message).toContain('name');
      expect(json.message).toContain('email');
      expect(json.message).toContain('message');
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('rejects invalid JSON with 400', async () => {
      const response = await call(makeRequest('{ not valid json', {}));

      expect(response.status).toBe(400);
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

  describe('bot tripwires (generic 400, no email is sent)', () => {
    const TRIPWIRE_MESSAGE = 'Invalid submission.';

    it('rejects when the honeypot field is missing entirely (direct API scripts)', async () => {
      const { website: _website, ...withoutHoneypot } = validPayload;
      const response = await call(makeRequest(withoutHoneypot));

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.message).toBe(TRIPWIRE_MESSAGE);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('rejects when the honeypot field is filled (form-filler bots)', async () => {
      const response = await call(makeRequest({ ...validPayload, website: 'https://spam.example' }));

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.message).toBe(TRIPWIRE_MESSAGE);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('rejects a missing token with the invalid-token code so the client can retry', async () => {
      const response = await call(makeRequest({ ...validPayload, token: undefined }));

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.message).toBe(TRIPWIRE_MESSAGE);
      expect(json.code).toBe('invalid-token');
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('rejects a forged token', async () => {
      const response = await call(makeRequest({ ...validPayload, token: '1700000000000.' + 'a'.repeat(64) }));

      expect(response.status).toBe(400);
      expect((await response.json()).code).toBe('invalid-token');
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('rejects a token submitted faster than a human could type a message', async () => {
      const response = await call(makeRequest({ ...validPayload, token: issueToken(Date.now()) }));

      expect(response.status).toBe(400);
      expect((await response.json()).code).toBe('invalid-token');
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

  describe('email plausibility (specific feedback, no email is sent)', () => {
    it('rejects a syntactically broken email with the email-syntax code', async () => {
      const response = await call(makeRequest({ ...validPayload, email: 'jane@gmailcom' }));

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.code).toBe('email-syntax');
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('rejects an email whose domain does not exist with the email-domain code', async () => {
      mockResolveMx.mockRejectedValue(Object.assign(new Error('ENOTFOUND'), { code: 'ENOTFOUND' }));

      const response = await call(makeRequest({ ...validPayload, email: 'jane@gmali.com' }));

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.code).toBe('email-domain');
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('accepts the submission when DNS fails for uncertain reasons (fail open)', async () => {
      mockResolveMx.mockRejectedValue(Object.assign(new Error('SERVFAIL'), { code: 'SERVFAIL' }));

      const response = await call(makeRequest(validPayload));

      expect(response.status).toBe(200);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });
  });
});
