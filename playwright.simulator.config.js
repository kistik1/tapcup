import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/simulator',
  timeout: 45_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'simulator-artifacts/playwright-report.json' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI && !process.env.VITE_TAPCUP_SIMULATOR_CONSUMER_CHIP_ID,
    env: {
      VITE_TAPCUP_SIMULATOR: 'true',
      VITE_TAPCUP_SIMULATOR_CONSUMER_CHIP_ID: process.env.VITE_TAPCUP_SIMULATOR_CONSUMER_CHIP_ID || '',
    },
  },
});
