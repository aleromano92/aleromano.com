import { defineMiddleware } from 'astro:middleware';
import { timingSafeEqual } from 'crypto';

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

function isAuthorized(request: Request): boolean {
  if (!ADMIN_USER || !ADMIN_PASS) {
    console.error(
      '[Middleware] ADMIN_USER and ADMIN_PASS must both be set - denying access to admin routes.',
    );
    return false;
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.slice(6);
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [user, pass] = credentials.split(':');

  // Use timing-safe comparison to prevent timing attacks
  const providedUserBuffer = Buffer.from(user || '');
  const adminUserBuffer = Buffer.from(ADMIN_USER);
  const userMatch =
    providedUserBuffer.length === adminUserBuffer.length &&
    timingSafeEqual(providedUserBuffer, adminUserBuffer);

  const providedPassBuffer = Buffer.from(pass || '');
  const adminPassBuffer = Buffer.from(ADMIN_PASS);
  const passMatch =
    providedPassBuffer.length === adminPassBuffer.length &&
    timingSafeEqual(providedPassBuffer, adminPassBuffer);

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
