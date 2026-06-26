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
      '@undef-games/scanlines-system/styles/entrance.css': resolve(__dirname, '../../scanlines-system/src/react/entrance.css'),
      '@undef-games/scanlines-system/styles/site.css': resolve(__dirname, '../../scanlines-system/src/atmosphere/site.css'),
      '@undef-games/scanlines-system': resolve(__dirname, '../../scanlines-system/src/index.ts'),
      '@testing-library/jest-dom/vitest': resolve(__dirname, 'node_modules/@testing-library/jest-dom/vitest.js'),
      '@testing-library/react': resolve(__dirname, 'node_modules/@testing-library/react'),
      '@testing-library/user-event': resolve(__dirname, 'node_modules/@testing-library/user-event'),
      '@provide-io/telemetry/react': resolve(__dirname, 'node_modules/@provide-io/telemetry/dist/react.js'),
      '@provide-io/telemetry': resolve(__dirname, 'node_modules/@provide-io/telemetry/dist/index.js'),
      'pixi.js': resolve(__dirname, 'node_modules/pixi.js/lib/index.mjs'),
      'react': resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    server: {
      deps: {
        inline: ['@provide-io/telemetry'],
      },
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.{test,spec}.{ts,tsx}',
        // Canvas/Pixi shells — covered by the /lab/ scene-smoke e2e:
        'src/app/app-shell.tsx',
        'src/station/station-signal-scene.tsx',
        // Bootstrap / mount-only shells (no logic):
        'src/main.tsx',
        'src/site-main.tsx',
        'src/app/App.tsx',
        // Type-only / test infra:
        'src/concepts/types.ts',
        'src/vite-env.d.ts',
        'src/test/setup.ts',
      ],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  }
})
