/**
 * Vitest Setup File
 * 
 * Configures MSW to intercept all HTTP requests during tests.
 */
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './src/mocks/server';

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
