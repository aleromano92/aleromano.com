import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
    
    environment: 'node',
    
    testTimeout: 10000,

    exclude: ['**/node_modules/**', '**/dist/**', '**/.stryker-tmp/**'],

    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/mocks/**',
        'src/types/**',
        'src/**/*.d.ts',
        'src/content/**',
        'src/env.d.ts',
      ],
      thresholds: {
        statements: 66,
        branches: 61,
        functions: 57,
        lines: 66,
      },
    },
  },
});
