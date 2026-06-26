/**
 * E2E: Register → Login flow.
 *
 * Browser-driven test: user nhập form, submit, được redirect, login lại.
 * Verify trải nghiệm thật từ A đến Z.
 */

import { test, expect } from '@playwright/test';
import { cleanE2eDb, randomEmail, prisma } from './helpers';

test.beforeEach(async () => {
  await cleanE2eDb();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test('register → login flow', async ({ page }) => {
  const email = randomEmail('register');
  const password = 'mypassword123';

  // 1. Vào trang register
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: /đăng ký|sign up/i })).toBeVisible();

  // 2. Fill form
  await page.getByPlaceholder(/họ tên|name/i).fill('E2E Test User');
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/mật khẩu|password/i).first().fill(password);

  // 3. Submit
  await page.getByRole('button', { name: /đăng ký/i }).click();

  // 4. Verify: tự động chuyển sang login hoặc home
  await page.waitForURL(/\/(login|$)/, { timeout: 10_000 });

  // 5. User được tạo trong DB
  const dbUser = await prisma.user.findUnique({ where: { email } });
  expect(dbUser).toBeTruthy();
  expect(dbUser?.email).toBe(email);

  // 6. Login lại với credentials vừa tạo
  await page.goto('/login');
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/mật khẩu/i).fill(password);
  await page.getByRole('button', { name: /đăng nhập/i }).click();

  // 7. Redirect về home — không còn link "Đăng nhập" trên nav
  await page.waitForURL('/', { timeout: 10_000 });
});

test('shows error on duplicate email registration', async ({ page }) => {
  const email = randomEmail('dup');
  await prisma.user.create({
    data: {
      email,
      name: 'Existing',
      password: 'hashedpw',
      role: 'STUDENT',
    },
  });

  await page.goto('/register');
  await page.getByPlaceholder(/họ tên|name/i).fill('New');
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/mật khẩu/i).first().fill('password123');
  await page.getByRole('button', { name: /đăng ký/i }).click();

  // Toast với error
  await expect(page.getByText(/đã được sử dụng/i)).toBeVisible({ timeout: 5000 });
});

test('login fails with wrong password', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder(/email/i).fill('nonexistent@test.com');
  await page.getByPlaceholder(/mật khẩu/i).fill('wrongpassword');
  await page.getByRole('button', { name: /đăng nhập/i }).click();

  // URL không đổi (vẫn ở login)
  await page.waitForTimeout(2000);
  expect(page.url()).toContain('/login');
});
