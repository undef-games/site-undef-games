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
        site: resolve(__dirname, 'src/site-main.tsx'),
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
      '@undef/scanlines-system': resolve(__dirname, '../packages/scanlines-system/src/index.ts'),
    },
  },
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts']
  }
})
