import { defineMiddleware } from 'astro:middleware';
import { timingSafeEqual } from 'crypto';

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

function isAuthorized(request: Request): boolean {
  if (!ADMIN_PASS) {
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
      console.warn(
        '[Middleware] ADMIN_PASS not set in development - admin routes are unprotected!',
      );
      return true;
    }

    console.error(
      '[Middleware] ADMIN_PASS not set in non-development environment - denying access to admin routes.',
    );
    return false;
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

  // Use timing-safe comparison to prevent timing attacks
  const userMatch = (() => {
    if (!ADMIN_USER) {
      // If no ADMIN_USER is set, accept any username (only password is checked)
      return true;
    }

    const providedUserBuffer = Buffer.from(user || '');
    const adminUserBuffer = Buffer.from(ADMIN_USER);

    if (providedUserBuffer.length !== adminUserBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedUserBuffer, adminUserBuffer);
  })();

  const passMatch = (() => {
    const providedPassBuffer = Buffer.from(pass || '');
    const adminPassBuffer = Buffer.from(ADMIN_PASS);

    if (providedPassBuffer.length !== adminPassBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedPassBuffer, adminPassBuffer);
  })();
  return userMatch && passMatch;
}

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
