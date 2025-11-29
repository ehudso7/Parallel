import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@parallel/ai': path.resolve(__dirname, './packages/ai/src'),
      '@parallel/database': path.resolve(__dirname, './packages/database/src'),
      '@parallel/analytics': path.resolve(__dirname, './packages/analytics/src'),
    },
  },
});
