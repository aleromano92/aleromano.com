import type { APIRoute } from 'astro';
import { issueToken } from '../../utils/contact-token';

/**
 * Issues the Form Token that POST /api/contact requires. Fetched by the
 * contact form on first interaction; rate-limited by nginx like /api/contact.
 */
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ token: issueToken() }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // A cached token would eventually be served past its max age.
      'Cache-Control': 'no-store',
    },
  });
};
