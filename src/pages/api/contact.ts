import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get("Content-Type") !== "application/json") {
    return new Response(JSON.stringify({ success: false, message: "Invalid content type, expected application/json." }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await request.json();
    const { reason, name, email, message } = data;

    // Basic validation
    if (!reason) {
      return new Response(JSON.stringify({ success: false, message: "Contact reason is required." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const reasonsRequiringAllFields = ["consultancy", "mentoring", "job", "general"];
    if (reasonsRequiringAllFields.includes(reason)) {
      if (!name || !email || !message) {
        let missingFields = [];
        if (!name) missingFields.push("name");
        if (!email) missingFields.push("email");
        if (!message) missingFields.push("message");
        return new Response(JSON.stringify({ success: false, message: `Missing required fields: ${missingFields.join(', ')}.` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else if (reason !== "bug") { // "bug" reason is handled client-side
        return new Response(JSON.stringify({ success: false, message: "Invalid contact reason." }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }


    const personalEmail = import.meta.env.ALE_PERSONAL_EMAIL;
    if (!personalEmail && reasonsRequiringAllFields.includes(reason)) {
      console.error("ALE_PERSONAL_EMAIL environment variable is not set.");
      return new Response(JSON.stringify({ success: false, message: "Server configuration error. Please try again later." }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log email sending action (actual email sending will be implemented later)
    console.log(`Preparing to send email for reason: ${reason}`);
    console.log(`From: ${name} <${email}>`);
    console.log(`To: ${personalEmail}`);
    console.log(`Message: ${message}`);
    console.log(`--- Email for ${reason} ---`);
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Message: ${message}`);
    console.log(`--------------------------`);


    // Placeholder for actual email sending logic
    // For now, we'll assume it's successful if it reaches this point.

    return new Response(JSON.stringify({ success: true, message: "Your message has been received. Thank you!" }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error processing contact form:", error);
    return new Response(JSON.stringify({ success: false, message: "An unexpected error occurred. Please try again later." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
