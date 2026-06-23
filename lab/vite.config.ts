import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/lab/',
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        site: resolve(__dirname, '../themes/scanlines/assets/ts/site.ts'),
        'theme-hydrate': resolve(__dirname, '../themes/scanlines/assets/ts/theme-hydrate.ts'),
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.names.some((name) => name.endsWith('.css'))) {
            return 'assets/style.css'
          }
          return 'assets/[name]-[hash][extname]'
        },
        entryFileNames: 'assets/[name].js',
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@undef-games/scanlines-system/styles/site.css': resolve(__dirname, '../packages/scanlines-system/src/atmosphere/site.css'),
      '@undef-games/scanlines-system': resolve(__dirname, '../packages/scanlines-system/src/index.ts'),
      '@testing-library/jest-dom/vitest': resolve(__dirname, 'node_modules/@testing-library/jest-dom/vitest.js'),
      '@testing-library/react': resolve(__dirname, 'node_modules/@testing-library/react'),
      '@testing-library/user-event': resolve(__dirname, 'node_modules/@testing-library/user-event'),
      'pixi.js': resolve(__dirname, 'node_modules/pixi.js/lib/index.mjs'),
      'react': resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}', '../packages/scanlines-system/src/**/*.{test,spec}.{ts,tsx}', '../packages/scanlines-system/scripts/**/*.{test,spec}.mjs'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      allowExternal: true,
      include: [
        '**/scanlines-system/src/tokens/log.ts',
        '**/scanlines-system/src/react/telemetry.ts',
        '**/scanlines-system/src/react/console/**',
        '**/scanlines-system/src/react/kit/**',
        '**/scanlines-system/src/surfaces/presets.ts',
      ],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  }
})
