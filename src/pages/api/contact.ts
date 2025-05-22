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

    // Validate if the reason is one of the allowed types for processing
    // "bug" reason is handled client-side and should not reach this API endpoint with full form data.
    // If it does, or if the reason is unknown, it's an invalid request.
    if (!VALID_CONTACT_REASONS.includes(reason)) {
        return createJsonResponse({ success: false, message: "Invalid contact reason provided." }, HTTP_BAD_REQUEST);
    }

    // For valid email reasons, all fields are required
    if (!name || !email || !message) {
      const missingFields: string[] = [];
      if (!name) missingFields.push("name");
      if (!email) missingFields.push("email");
      if (!message) missingFields.push("message");
      return createJsonResponse({ success: false, message: `Missing required fields: ${missingFields.join(', ')}.` }, HTTP_BAD_REQUEST);
    }

    const PERSONAL_EMAIL = import.meta.env.ALE_PERSONAL_EMAIL;
    if (!PERSONAL_EMAIL && VALID_CONTACT_REASONS.includes(reason)) {
      console.error("ALE_PERSONAL_EMAIL environment variable is not set.");
      return createJsonResponse({ success: false, message: "Server configuration error (email recipient not set). Please try again later." }, HTTP_INTERNAL_SERVER_ERROR);
    }

    // Email sending logic for valid reasons
    if (VALID_CONTACT_REASONS.includes(reason)) {
      let transporter;
      const smtpHost = import.meta.env.SMTP_HOST;
      const smtpPort = parseInt(import.meta.env.SMTP_PORT || '587', 10);
      const smtpUser = import.meta.env.SMTP_USER;
      const smtpPass = import.meta.env.SMTP_PASS;
      const smtpSecure = import.meta.env.SMTP_SECURE === 'true' || (import.meta.env.SMTP_SECURE !== 'false' && smtpPort === 465);

      if (smtpHost && smtpUser && smtpPass) {
        transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure, // true for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
      } else {
        // Fallback to a test account if SMTP creds are not set (for local dev)
        console.log("SMTP configuration not found, creating a test account for email sending.");
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
          },
        });
        console.log("Test account created. User: %s, Pass: %s", testAccount.user, testAccount.pass);
      }

      const mailOptions = {
        from: `"${name} via aleromano.com" <${PERSONAL_EMAIL}>`, // Sender address (must be authorized by SMTP server)
        to: PERSONAL_EMAIL, // List of receivers
        replyTo: email, // User's email from the form
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
        if (!smtpHost) { // If using Ethereal
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
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
