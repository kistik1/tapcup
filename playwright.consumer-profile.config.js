import { defineConfig } from '@playwright/test';

const baseURL = process.env.TAPCUP_PROFILE_BASE_URL?.trim() || 'https://test-dev.kistik.uk';

export default defineConfig({
  testDir: './tests/profiling',
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'profiling-artifacts/playwright-report.json' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
