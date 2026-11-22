import { beforeAll, afterEach, afterAll } from 'vitest';
import fc from 'fast-check';
import { server } from './src/mocks/server';

fc.configureGlobal({ seed: 0x5eed, numRuns: 300 });

process.env.DATABASE_PATH = ':memory:';

process.env.ANALYTICS_SALT = 'test-salt-value';

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'warn' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
