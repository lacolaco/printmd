import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env['CI'] ? 1 : 0,
  use: {
    baseURL: 'http://localhost:4299',
  },
  webServer: {
    command: 'npm start -- --port 4299',
    url: 'http://localhost:4299',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
