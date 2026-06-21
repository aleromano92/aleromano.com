import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Include setup file to start MSW server
    setupFiles: ['./vitest.setup.ts'],
    
    // Environment configuration
    environment: 'node',
    
    // Global test timeout
    testTimeout: 10000,

    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html', 'lcov'],
      // Measure unit-testable TypeScript source. .astro components are covered by
      // the build + `astro check` gate, not by vitest, so they are excluded here.
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/mocks/**',
        'src/types/**',
        'src/**/*.d.ts',
        'src/content/**',
        'src/env.d.ts',
      ],
      // Ratchet floor: set just below the current baseline so any regression fails
      // the build, while today's suite passes. Raise these as coverage grows.
      thresholds: {
        statements: 64,
        branches: 59,
        functions: 54,
        lines: 64,
      },
    },
  },
});
