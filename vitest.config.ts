import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Include setup file to start MSW server
    setupFiles: ['./vitest.setup.ts'],
    
    // Environment configuration
    environment: 'node',
    
    // Global test timeout
    testTimeout: 10000,

    // Never pick up Stryker's instrumented sandbox copies.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.stryker-tmp/**'],

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
      // Ratchet floor: set a couple of points below the current baseline
      // (stmts 64.09 / branch 59.65 / funcs 54.81 / lines 64.21) so a meaningful
      // regression fails the build, but a single uncovered helper in an otherwise
      // good PR doesn't trip a spurious failure. Raise these as coverage grows.
      thresholds: {
        statements: 63,
        branches: 58,
        functions: 53,
        lines: 63,
      },
    },
  },
});
