import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  // Claude Sonnet 5.5, 2026-11-16: lets lib/seo-sitemap-meta.test.ts import app/**/page.tsx to read each page's metadata.
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'app/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
})
