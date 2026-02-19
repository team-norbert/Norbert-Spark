import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@norberts-sparke/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  test: {
    globals: true,
    include: ['pacts/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})
