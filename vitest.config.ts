import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/helpers/setup.ts'],
    globals: true,
    // Loại trừ Playwright tests (chạy bởi runner khác)
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**', '**/.next/**'],
    // Coverage config
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.config.*',
        '**/types/**',
        'src/app/**/layout.tsx',
        'src/app/**/loading.tsx',
        'src/app/**/error.tsx',
        'src/app/**/not-found.tsx',
        'prisma/**',
      ],
      thresholds: {
        // Targets sau khi suite ổn định
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },
    },
    // Integration tests cần DB → chạy serial để tránh xung đột
    pool: 'forks',
    // Timeout cho integration tests có DB
    testTimeout: 10_000,
    // Hooks timeout (beforeAll cleanDb có thể cần thời gian)
    hookTimeout: 30_000,
  },
});
