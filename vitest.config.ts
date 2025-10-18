import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Include setup file to start MSW server
    setupFiles: ['./vitest.setup.ts'],
    
    // Environment configuration
    environment: 'node',
    
    // Global test timeout
    testTimeout: 10000,
  },
});
