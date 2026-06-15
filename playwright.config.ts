import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
  },
  webServer: {
    command: './node_modules/.bin/http-server public -a 127.0.0.1 -p 4173',
    port: 4173,
    reuseExistingServer: true,
  },
})
