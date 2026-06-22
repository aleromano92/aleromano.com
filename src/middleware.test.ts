import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// astro:middleware is a virtual module; defineMiddleware just returns its handler.
vi.mock('astro:middleware', () => ({ defineMiddleware: (fn: unknown) => fn }));

/**
 * Behavioural gate for the /admin Basic-Auth guard.
 *
 * The architectural fitness function (R5 in architecture.test.ts) only checks
 * that middleware.ts still references the /admin prefix — a cheap structural
 * canary. THIS file is the real authorization gate: it drives the middleware
 * and asserts it actually denies/permits requests.
 */

const ORIGINAL_ENV = { ...process.env };
const VALID_USER = 'admin';
const VALID_PASS = 's3cr3t';

// Credentials are read at module load, so import the middleware fresh after
// setting the desired env for each scenario.
async function loadMiddleware(env: { user?: string; pass?: string }) {
  vi.resetModules();
  if (env.user === undefined) delete process.env.ADMIN_USER;
  else process.env.ADMIN_USER = env.user;
  if (env.pass === undefined) delete process.env.ADMIN_PASS;
  else process.env.ADMIN_PASS = env.pass;
  const mod = await import('./middleware');
  // The handler's real type expects a full Astro APIContext; for a focused unit
  // test we drive it with the minimal { request, url } it actually reads.
  return mod.onRequest as (context: unknown, next: unknown) => Promise<Response>;
}

function basicAuth(user: string, pass: string): string {
  return 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
}

function contextFor(pathname: string, authHeader?: string) {
  const url = new URL(`http://localhost${pathname}`);
  const headers = new Headers();
  if (authHeader) headers.set('Authorization', authHeader);
  return { request: new Request(url, { headers }), url };
}

const okNext = () => vi.fn(async () => new Response('ok', { status: 200 }));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe('admin auth middleware', () => {
  it('returns 401 and does not run the handler for /admin without credentials', async () => {
    const onRequest = await loadMiddleware({ user: VALID_USER, pass: VALID_PASS });
    const next = okNext();

    const res = await onRequest(contextFor('/admin'), next);

    expect(res.status).toBe(401);
    expect(res.headers.get('WWW-Authenticate')).toContain('Basic');
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for /admin with wrong credentials', async () => {
    const onRequest = await loadMiddleware({ user: VALID_USER, pass: VALID_PASS });
    const next = okNext();

    const res = await onRequest(contextFor('/admin/analytics', basicAuth(VALID_USER, 'wrong')), next);

    expect(res.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows /admin through with correct credentials', async () => {
    const onRequest = await loadMiddleware({ user: VALID_USER, pass: VALID_PASS });
    const next = okNext();

    const res = await onRequest(contextFor('/admin/analytics', basicAuth(VALID_USER, VALID_PASS)), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('fails closed: denies /admin when ADMIN_USER/PASS are not configured', async () => {
    const onRequest = await loadMiddleware({ user: undefined, pass: undefined });
    const next = okNext();

    const res = await onRequest(contextFor('/admin', basicAuth(VALID_USER, VALID_PASS)), next);

    expect(res.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('does not require auth for non-admin routes', async () => {
    const onRequest = await loadMiddleware({ user: VALID_USER, pass: VALID_PASS });
    const next = okNext();

    const res = await onRequest(contextFor('/blog'), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    // Global discovery Link headers are appended on the way out.
    expect(res.headers.get('Link')).toContain('llms.txt');
  });
});
