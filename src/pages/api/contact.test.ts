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

import { POST } from './contact';

const RECIPIENT = 'ale@example.com';

function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function call(request: Request) {
  // The route only uses `request` from the APIContext.
  return POST({ request } as Parameters<typeof POST>[0]);
}

const validPayload = {
  reason: 'general',
  name: 'Jane Doe',
  email: 'jane@external.com',
  message: 'Hello there\nsecond line',
};

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  mockSendMail.mockResolvedValue({ messageId: '<test-message-id>' });
  mockCreateTestAccount.mockResolvedValue({ user: 'ethereal-user', pass: 'ethereal-pass' });
  mockGetTestMessageUrl.mockReturnValue('https://ethereal.email/message/preview');
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
      expect(mailOptions.from).toContain(validPayload.name);
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
      const response = await call(makeRequest({ reason: 'general', name: '', email: '', message: '' }));

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
});
