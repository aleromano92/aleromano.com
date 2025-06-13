import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

// Define HTTP status codes
const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_INTERNAL_SERVER_ERROR = 500;

// Define the structure for API responses
interface ApiResponseData {
  success: boolean;
  message: string;
  data?: unknown; // Optional field for additional data
}

// Helper function to create standardized JSON responses
function createJsonResponse(responseData: ApiResponseData, status: number): Response {
  return new Response(JSON.stringify(responseData), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Define allowed contact reasons that require full form data and email sending
const VALID_CONTACT_REASONS = ["consultancy", "mentoring", "job", "general"];

interface MailTransportConfig {
  transportOptions: nodemailer.TransportOptions;
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
      } as nodemailer.TransportOptions,
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
      } as nodemailer.TransportOptions,
      isEthereal: true,
    };
  }
}

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get("Content-Type") !== "application/json") {
    return createJsonResponse({ success: false, message: "Invalid content type, expected application/json." }, HTTP_BAD_REQUEST);
  }

  try {
    const data = await request.json();
    const { reason, name, email, message } = data;

    // Basic validation for the reason
    if (!reason) {
      return createJsonResponse({ success: false, message: "Contact reason is required." }, HTTP_BAD_REQUEST);
    }

    if (!VALID_CONTACT_REASONS.includes(reason)) {
        return createJsonResponse({ success: false, message: "Invalid contact reason provided." }, HTTP_BAD_REQUEST);
    }

    if (!name || !email || !message) {
      const missingFields: string[] = [];
      if (!name) missingFields.push("name");
      if (!email) missingFields.push("email");
      if (!message) missingFields.push("message");
      return createJsonResponse({ success: false, message: `Missing required fields: ${missingFields.join(', ')}.` }, HTTP_BAD_REQUEST);
    }

    const PERSONAL_EMAIL = import.meta.env.ALE_PERSONAL_EMAIL || process.env.ALE_PERSONAL_EMAIL;
    if (!PERSONAL_EMAIL) {
      console.error("ALE_PERSONAL_EMAIL environment variable is not set through import.meta.env or process.env.");
      return createJsonResponse({ success: false, message: "Server configuration error (email recipient not set). Please try again later." }, HTTP_INTERNAL_SERVER_ERROR);
    }

    if (VALID_CONTACT_REASONS.includes(reason)) {
      const { transportOptions, isEthereal } = await getMailTransportConfig();
      const transporter = nodemailer.createTransport(transportOptions);

      const mailOptions = {
        from: `"${name} via aleromano.com" ${PERSONAL_EMAIL}>`,
        to: PERSONAL_EMAIL,
        replyTo: email,
        subject: `Contact Form: ${reason}`,
        text: `You have a new contact form submission:\n\nName: ${name}\nEmail: ${email}\nReason: ${reason}\nMessage:\n${message}`,
        html: `<p>You have a new contact form submission:</p>
               <ul>
                 <li><strong>Name:</strong> ${name}</li>
                 <li><strong>Email:</strong> ${email}</li>
                 <li><strong>Reason:</strong> ${reason}</li>
               </ul>
               <p><strong>Message:</strong></p>
               <p>${message.replace(/\n/g, '<br>')}</p>`,
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        if (isEthereal) {
          console.log('Preview URL (Ethereal): %s', nodemailer.getTestMessageUrl(info));
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        return createJsonResponse({ success: false, message: "Failed to send message. Please try again later." }, HTTP_INTERNAL_SERVER_ERROR);
      }
    }

    return createJsonResponse({ success: true, message: "Your message has been received. Thank you!" }, HTTP_OK);

  } catch (error) {
    console.error("Error processing contact form:", error);
    return createJsonResponse({ success: false, message: "An unexpected error occurred. Please try again later." }, HTTP_INTERNAL_SERVER_ERROR);
  }
};
