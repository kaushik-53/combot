import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use Node environment (no DOM)
    environment: 'node',
    // Run tests sequentially since they share an in-memory MongoDB instance
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    // Allow top-level await in test files
    globals: false,
  },
});
