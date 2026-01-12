/**
 * Vitest Setup File
 * 
 * Configures MSW to intercept all HTTP requests during tests.
 * Sets up in-memory database for testing.
 */
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './src/mocks/server';

// Configure in-memory database for tests
process.env.DATABASE_PATH = ':memory:';

// Set up analytics salt for tests
process.env.ANALYTICS_SALT = 'test-salt-value';

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers after each test to prevent test pollution
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests are done
afterAll(() => {
  server.close();
});
