/**
 * Global test setup — loaded BEFORE every test file.
 *
 * Trách nhiệm:
 *   - Load .env.test để override secrets (vd. RESEND_API_KEY → empty để test không gửi mail thật)
 *   - Setup @testing-library/jest-dom matchers
 *   - Mock Next.js APIs không có trong happy-dom
 */

import '@testing-library/jest-dom/vitest';
import { config } from 'dotenv';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Load test env (override defaults)
config({ path: '.env.test' });

// Force NODE_ENV cho tests (Next.js env validation)
// NODE_ENV được khai báo readonly trong @types/node → dùng vi.stubEnv để gán an toàn.
vi.stubEnv('NODE_ENV', 'test');

// QUAN TRỌNG: Đảm bảo RESEND_API_KEY là empty để emails KHÔNG gửi thật trong test
// (nếu test dev quên set, không bị ăn quota Resend)
if (!process.env.VITEST_ALLOW_REAL_EMAIL) {
  delete process.env.RESEND_API_KEY;
}

// Cleanup React Testing Library DOM sau mỗi test
afterEach(() => {
  cleanup();
});

// Mock Next.js navigation hooks (không có sẵn trong happy-dom)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock next-auth client side
vi.mock('next-auth/react', async () => {
  const actual = await vi.importActual<typeof import('next-auth/react')>('next-auth/react');
  return {
    ...actual,
    signIn: vi.fn(),
    signOut: vi.fn(),
    useSession: vi.fn(() => ({ data: null, status: 'unauthenticated' })),
  };
});
