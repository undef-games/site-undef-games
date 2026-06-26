import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['themes/scanlines/assets/ts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['themes/scanlines/assets/ts/**/*.ts'],
      exclude: ['**/*.test.ts'],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
  resolve: {
    alias: {
      // CSS subpath import in site.ts — stub to an empty file so jsdom tests don't choke on CSS:
      '@undef-games/scanlines-system/styles/site.css': resolve(__dirname, 'test/empty.css'),
      // Resolve the package to the sibling source (mirrors lab/vite.config.ts); tests vi.mock it anyway:
      '@undef-games/scanlines-system': resolve(__dirname, '../scanlines-system/src/index.ts'),
    },
  },
})
