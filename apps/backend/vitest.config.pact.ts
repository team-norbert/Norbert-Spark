import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['pact/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    setupFiles: ['./test/setup.ts'],
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
})
