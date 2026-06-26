import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config.
 *
 * Tests chạy với:
 *   - Test DB (Postgres trong Docker, port 5433)
 *   - Next.js dev server tự khởi động (webServer config)
 *   - Mỗi test isolated session storage
 *
 * Run: npm run test:e2e
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // E2E test có DB state → serial an toàn hơn
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 1 worker để tránh xung đột DB
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Bật thêm khi cần test Safari iOS hoặc Firefox:
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // E2E dùng test DB
      DATABASE_URL: 'postgresql://test:test@localhost:5433/lumina_test',
      NEXTAUTH_URL: 'http://localhost:3000',
      NEXTAUTH_SECRET: 'test-e2e-secret-1234567890',
      RESEND_API_KEY: '', // không gửi email thật
    },
  },
});
