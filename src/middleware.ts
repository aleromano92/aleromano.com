import { defineMiddleware } from 'astro:middleware';

// Basic Auth credentials from environment
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS;

/**
 * Check if Basic Auth is valid
 */
function isAuthorized(request: Request): boolean {
  if (!ADMIN_PASS) {
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
      console.warn(
        '[Middleware] ADMIN_PASS not set in development - admin routes are unprotected!',
      );
      return true; // Allow access only in development when no password is configured
    }

    console.error(
      '[Middleware] ADMIN_PASS not set in non-development environment - denying access to admin routes.',
    );
    return false; // Fail closed outside development
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.slice(6);
  const credentials =
    typeof globalThis.atob === 'function'
      ? globalThis.atob(base64Credentials)
      : Buffer.from(base64Credentials, 'base64').toString('utf-8');
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
