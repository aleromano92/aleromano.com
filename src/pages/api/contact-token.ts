import type { APIRoute } from 'astro';
import { issueToken } from '../../utils/contact-token';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ token: issueToken() }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
