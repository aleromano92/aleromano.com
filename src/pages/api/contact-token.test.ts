import { describe, it, expect } from 'vitest';
import { GET } from './contact-token';
import { verifyToken, TOKEN_MIN_AGE_MS } from '../../utils/contact-token';

function call() {
  const request = new Request('http://localhost/api/contact-token');
  return GET({ request } as Parameters<typeof GET>[0]);
}

describe('GET /api/contact-token', () => {
  it('returns a token that the verifier accepts once the minimum age has passed', async () => {
    const response = await call();

    expect(response.status).toBe(200);
    const { token } = await response.json();
    expect(verifyToken(token, Date.now() + TOKEN_MIN_AGE_MS)).toEqual({ valid: true });
  });

  it('forbids caching, which would serve expired tokens', async () => {
    const response = await call();

    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});
