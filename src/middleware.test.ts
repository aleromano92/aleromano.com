import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('astro:middleware', () => ({ defineMiddleware: (fn: unknown) => fn }));

const ORIGINAL_ENV = { ...process.env };
const VALID_USER = 'admin';
const VALID_PASS = 's3cr3t';

async function loadMiddleware(env: { user?: string; pass?: string }) {
  vi.resetModules();
  if (env.user === undefined) delete process.env.ADMIN_USER;
  else process.env.ADMIN_USER = env.user;
  if (env.pass === undefined) delete process.env.ADMIN_PASS;
  else process.env.ADMIN_PASS = env.pass;
  const mod = await import('./middleware');
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
    expect(res.headers.get('Link')).toContain('llms.txt');
  });
});

describe('image endpoint guard', () => {
  it('returns 400 without running the handler for a malformed /_image request', async () => {
    const onRequest = await loadMiddleware({ user: VALID_USER, pass: VALID_PASS });
    const next = okNext();

    const res = await onRequest(
      contextFor('/_image?href=%2F_astro%2Flogo.Ab12.png&w=80&f=webp%29%20AND%201%3D1'),
      next,
    );

    expect(res.status).toBe(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes a valid /_image request through to the handler', async () => {
    const onRequest = await loadMiddleware({ user: VALID_USER, pass: VALID_PASS });
    const next = okNext();

    const res = await onRequest(contextFor('/_image?href=%2F_astro%2Flogo.Ab12.png&w=80&f=webp'), next);

    expect(res.status).toBe(200);
    expect(next).toHaveBeenCalledOnce();
  });
});
