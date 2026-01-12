import { defineMiddleware } from 'astro:middleware';

// Basic Auth credentials from environment
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS;

/**
 * Check if Basic Auth is valid
 */
function isAuthorized(request: Request): boolean {
  if (!ADMIN_PASS) {
    console.warn('[Middleware] ADMIN_PASS not set - admin routes are unprotected!');
    return true; // Allow access if no password is configured (dev mode)
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.slice(6);
  const credentials = atob(base64Credentials);
  const [user, pass] = credentials.split(':');

  return user === ADMIN_USER && pass === ADMIN_PASS;
}

/**
 * Create 401 response requesting Basic Auth
 */
function createUnauthorizedResponse(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Area"',
      'Content-Type': 'text/plain',
    },
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;
  const pathname = url.pathname;

  // Basic Auth protection for /admin routes
  if (pathname.startsWith('/admin')) {
    if (!isAuthorized(request)) {
      return createUnauthorizedResponse();
    }
  }

  return next();
});
