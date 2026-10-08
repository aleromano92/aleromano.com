import type { APIRoute } from 'astro';
import nodemailer, { type TransportOptions } from 'nodemailer';
import { verifyToken } from '../../utils/contact-token';
import { isPlausibleEmail, domainAcceptsMail } from '../../utils/email-validation';

// Define HTTP status codes
const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_INTERNAL_SERVER_ERROR = 500;

// Define the structure for API responses
interface ApiResponseData {
  success: boolean;
  message: string;
  /** Machine-readable error code the client maps to a localized message */
  code?: string;
  data?: unknown; // Optional field for additional data
}

// Tripwire Rejections deliberately share one generic message: a bot author
// must not learn which check caught them. Humans never see it — the honest
// client always sends the honeypot empty and retries on invalid-token.
const TRIPWIRE_MESSAGE = 'Invalid submission.';

// Helper function to create standardized JSON responses
function createJsonResponse(responseData: ApiResponseData, status: number): Response {
  return new Response(JSON.stringify(responseData), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

const VALID_CONTACT_REASONS = ["consultancy", "mentoring", "job", "blogpost", "general"];

const MAX_PAYLOAD_BYTES = 10 * 1024; // 10 KB
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5_000;
const MAX_BLOG_POST_TITLE_LENGTH = 200;

interface MailTransportConfig {
  transportOptions: TransportOptions;
  isEthereal: boolean;
}

async function getMailTransportConfig(): Promise<MailTransportConfig> {
  const smtpHost = import.meta.env.SMTP_HOST || process.env.SMTP_HOST;
  // Defaulting to 1025 here is a fallback if SMTP_PORT is somehow not set when using smtp-relay.
  const smtpPortString = import.meta.env.SMTP_PORT || process.env.SMTP_PORT || '1025';
  const smtpPort = parseInt(smtpPortString, 10);

  if (smtpHost === 'smtp-relay') {
    console.log(`Using internal SMTP relay for email sending: ${smtpHost}:${smtpPort}`);
    return {
      transportOptions: {
        host: smtpHost,
        port: smtpPort,
        secure: false, // Typically, internal relays might not use TLS for app-to-relay communication.
                      // The relay itself handles secure connection to the external SMTP (e.g., Gmail).
      } as TransportOptions,
      isEthereal: false,
    };
  } else {
    // This 'else' block is entered if SMTP_HOST is not 'smtp-relay'.
    // This indicates a deviation from the primary intended production setup or local dev without the relay.
    // Fallback to Ethereal for local development or as an indicator of misconfiguration.
    console.warn(
      `WARNING: SMTP_HOST is configured to '${smtpHost || 'undefined'}' instead of 'smtp-relay'. ` +
      `The system is intended to use 'smtp-relay' for actual email delivery. ` +
      `Falling back to an Ethereal test account. Emails sent via this fallback WILL NOT be delivered to actual recipients. ` +
      `They will go to a test inbox on Ethereal. ` +
      `For production/real email sending, ensure SMTP_HOST is set to 'smtp-relay' and SMTP_PORT is correctly configured (usually 1025 for the relay).`
    );
    const testAccount = await nodemailer.createTestAccount();
    console.log(
      `Ethereal fallback: Test account created. User: ${testAccount.user}, Pass: ${testAccount.pass}. ` +
      `Emails can be previewed at Ethereal if sent successfully.`
    );
    return {
      transportOptions: {
        host: 'smtp.ethereal.email',
        port: 587, // Ethereal's standard SMTP port
        secure: false, // Ethereal typically uses STARTTLS on port 587, so \`secure: false\` is correct.
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      } as TransportOptions,
      isEthereal: true,
    };
  }
}

function badRequest(message: string, code?: string): Response {
  return createJsonResponse({ success: false, message, ...(code && { code }) }, HTTP_BAD_REQUEST);
}

interface ContactSubmission {
  reason: string;
  name: string;
  email: string;
  message: string;
  blogPostTitle?: string;
}

// Each step returns either the value it produced or the Response that ends the request.

function checkRequestHeaders(request: Request): Response | null {
  if (request.headers.get("Content-Type") !== "application/json") {
    return badRequest("Invalid content type, expected application/json.");
  }

  const contentLength = request.headers.get("Content-Length");
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return createJsonResponse({ success: false, message: "Payload too large." }, 413);
  }
  return null;
}

async function readJsonObject(request: Request): Promise<Record<string, unknown> | Response> {
  const bodyText = await request.text();
  if (Buffer.byteLength(bodyText, 'utf8') > MAX_PAYLOAD_BYTES) {
    return createJsonResponse({ success: false, message: "Payload too large." }, 413);
  }

  let data: unknown;
  try {
    data = JSON.parse(bodyText);
  } catch {
    return badRequest("Invalid JSON.");
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return badRequest("Invalid JSON.");
  }
  return data as Record<string, unknown>;
}

function checkTripwires({ website, token }: Record<string, unknown>): Response | null {
  // Honeypot: the honest client always sends `website`, always empty.
  if (typeof website !== 'string' || website !== '') {
    console.warn('Contact tripwire: honeypot', { present: website !== undefined });
    return badRequest(TRIPWIRE_MESSAGE);
  }

  const tokenResult = verifyToken(typeof token === 'string' ? token : '');
  if (!tokenResult.valid) {
    console.warn('Contact tripwire: token', { reason: tokenResult.reason });
    return badRequest(TRIPWIRE_MESSAGE, 'invalid-token');
  }
  return null;
}

function validateFields(data: Record<string, unknown>): ContactSubmission | Response {
  const { reason, name, email, message, blogPostTitle } = data;

  if (typeof reason !== 'string' || !reason) {
    return badRequest("Contact reason is required.");
  }

  if (!VALID_CONTACT_REASONS.includes(reason)) {
    return badRequest("Invalid contact reason provided.");
  }

  if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
    return badRequest("Invalid field types.");
  }

  const missingFields = Object.entries({ name, email, message })
    .filter(([, value]) => !value)
    .map(([field]) => field);
  if (missingFields.length > 0) {
    return badRequest(`Missing required fields: ${missingFields.join(', ')}.`);
  }

  if (name.length > MAX_NAME_LENGTH || email.length > MAX_EMAIL_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
    return badRequest("One or more fields exceed the maximum allowed length.");
  }

  if (blogPostTitle !== undefined && (typeof blogPostTitle !== 'string' || blogPostTitle.length > MAX_BLOG_POST_TITLE_LENGTH)) {
    return badRequest("Blog post title is invalid or exceeds the maximum allowed length.");
  }

  return { reason, name, email, message, blogPostTitle };
}

// Human Mistake checks: specific feedback so a real sender can fix a typo'd
// address. The MX lookup fails open — DNS uncertainty must not cost a lead.
async function checkEmailAddress(email: string): Promise<Response | null> {
  if (!isPlausibleEmail(email)) {
    return badRequest("That email address doesn't look right. Please double-check it.", 'email-syntax');
  }

  if (!(await domainAcceptsMail(email))) {
    return badRequest("The domain of that email address doesn't seem to receive mail. Is it spelled correctly?", 'email-domain');
  }
  return null;
}

function buildMailOptions({ reason, name, email, message, blogPostTitle }: ContactSubmission, recipient: string) {
  return {
    from: `"${name} via aleromano.com" <${recipient}>`,
    to: recipient,
    replyTo: email,
    subject: `Contact Form: ${reason}${blogPostTitle ? ` - ${blogPostTitle}` : ''}`,
    text: `You have a new contact form submission:\n\nName: ${name}\nEmail: ${email}\nReason: ${reason}${blogPostTitle ? `\nBlog Post Title: ${blogPostTitle}` : ''}\nMessage:\n${message}`,
    html: `<p>You have a new contact form submission:</p>
           <ul>
             <li><strong>Name:</strong> ${name}</li>
             <li><strong>Email:</strong> ${email}</li>
             <li><strong>Reason:</strong> ${reason}</li>
             ${blogPostTitle ? `<li><strong>Blog Post Title:</strong> ${blogPostTitle}</li>` : ''}
           </ul>
           <p><strong>Message:</strong></p>
           <p>${message.replace(/\n/g, '<br>')}</p>`,
  };
}

async function sendContactEmail(submission: ContactSubmission): Promise<Response | null> {
  const PERSONAL_EMAIL = import.meta.env.ALE_PERSONAL_EMAIL || process.env.ALE_PERSONAL_EMAIL;
  if (!PERSONAL_EMAIL) {
    console.error("ALE_PERSONAL_EMAIL environment variable is not set through import.meta.env or process.env.");
    return createJsonResponse({ success: false, message: "Server configuration error (email recipient not set). Please try again later." }, HTTP_INTERNAL_SERVER_ERROR);
  }

  const { transportOptions, isEthereal } = await getMailTransportConfig();
  const transporter = nodemailer.createTransport(transportOptions);

  try {
    const info = await transporter.sendMail(buildMailOptions(submission, PERSONAL_EMAIL));
    console.log('Message sent: %s', info.messageId);
    if (isEthereal) {
      console.log('Preview URL (Ethereal): %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (emailError) {
    console.error("Error sending email:", emailError);
    return createJsonResponse({ success: false, message: "Failed to send message. Please try again later." }, HTTP_INTERNAL_SERVER_ERROR);
  }
  return null;
}

export const POST: APIRoute = async ({ request }) => {
  const headerError = checkRequestHeaders(request);
  if (headerError) return headerError;

  try {
    const data = await readJsonObject(request);
    if (data instanceof Response) return data;

    const tripwire = checkTripwires(data);
    if (tripwire) return tripwire;

    const submission = validateFields(data);
    if (submission instanceof Response) return submission;

    const addressError = await checkEmailAddress(submission.email);
    if (addressError) return addressError;

    const sendError = await sendContactEmail(submission);
    if (sendError) return sendError;

    return createJsonResponse({ success: true, message: "Your message has been received. Thank you!" }, HTTP_OK);

  } catch (error) {
    console.error("Error processing contact form:", error);
    return createJsonResponse({ success: false, message: "An unexpected error occurred. Please try again later." }, HTTP_INTERNAL_SERVER_ERROR);
  }
};
