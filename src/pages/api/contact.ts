import type { APIRoute } from 'astro';

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
const VALID_EMAIL_REASONS = ["consultancy", "mentoring", "job", "general"];

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
    if (!VALID_EMAIL_REASONS.includes(reason)) {
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
    if (!PERSONAL_EMAIL) {
      console.error("ALE_PERSONAL_EMAIL environment variable is not set.");
      return createJsonResponse({ success: false, message: "Server configuration error. Please try again later." }, HTTP_INTERNAL_SERVER_ERROR);
    }

    // Log email sending action (actual email sending will be implemented later)
    console.log(`Preparing to send email for reason: ${reason}`);
    console.log(`From: ${name} <${email}>`);
    console.log(`To: ${PERSONAL_EMAIL}`);
    console.log(`Message: ${message}`);
    console.log(`--- Email for ${reason} ---`);
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Message: ${message}`);
    console.log(`--------------------------`);

    // Placeholder for actual email sending logic
    // For now, we'll assume it's successful if it reaches this point.

    return createJsonResponse({ success: true, message: "Your message has been received. Thank you!" }, HTTP_OK);

  } catch (error) {
    console.error("Error processing contact form:", error);
    return createJsonResponse({ success: false, message: "An unexpected error occurred. Please try again later." }, HTTP_INTERNAL_SERVER_ERROR);
  }
};
