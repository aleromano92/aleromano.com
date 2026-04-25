import { defineMiddleware } from 'astro:middleware';
import { timingSafeEqual } from 'crypto';

const ADMIN_USER = import.meta.env.ADMIN_USER || process.env.ADMIN_USER;
const ADMIN_PASS = import.meta.env.ADMIN_PASS || process.env.ADMIN_PASS;

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

const GLOBAL_LINK_HEADERS = [
  '</llms.txt>; rel="alternate"; type="text/plain"; title="LLM Index"',
  '</llms-full.txt>; rel="alternate"; type="text/plain"; title="LLM Full Corpus"',
  '</rss.xml>; rel="alternate"; type="application/rss+xml"; title="RSS Feed"',
  '</sitemap-index.xml>; rel="sitemap"',
];

// Matches /posts/my-post and /posts/it/my-post (with optional trailing slash),
// but not /posts/tags/*, /posts/.../present, or .md endpoints.
const POST_PAGE_RE = /^\/posts\/(?:it\/)?[^/]+\/?$/;

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;
  const pathname = url.pathname;

  if (pathname.startsWith('/admin')) {
    if (!isAuthorized(request)) {
      return createUnauthorizedResponse();
    }
  }

  const response = await next();

  const headers = new Headers(response.headers);
  for (const link of GLOBAL_LINK_HEADERS) {
    headers.append('Link', link);
  }

  if (POST_PAGE_RE.test(pathname) && !pathname.includes('/tags')) {
    const mdUrl = pathname.replace(/\/$/, '') + '.md';
    headers.append('Link', `<${mdUrl}>; rel="alternate"; type="text/markdown"`);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
