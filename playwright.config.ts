import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env['CI'] ? 1 : 0,
  use: {
    baseURL: 'http://localhost:4299',
  },
  projects: [
    // page.pdf は Chromium 専用のため、印刷一致の検証は Chromium で行う
    { name: 'chromium', use: { browserName: 'chromium' }, testIgnore: '**/webkit-*.spec.ts' },
    // WebKit は対応 CSS が異なる (break-before: column 非対応など)。画面側の分割だけ検証する
    { name: 'webkit', use: { browserName: 'webkit' }, testMatch: '**/webkit-*.spec.ts' },
  ],
  webServer: {
    command: 'npm start -- --port 4299',
    url: 'http://localhost:4299',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
