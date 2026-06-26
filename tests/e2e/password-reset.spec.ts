/**
 * E2E: Forgot password → reset password flow.
 *
 * Token được fetch trực tiếp từ DB (vì email không gửi thật trong test).
 * Mô phỏng user click link trong email bằng cách build URL với token raw.
 */

import { test, expect } from '@playwright/test';
import { cleanE2eDb, seedTestUser, randomEmail, prisma } from './helpers';
import crypto from 'crypto';

test.beforeEach(async () => {
  await cleanE2eDb();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test('forgot password → reset → login with new password', async ({ page }) => {
  const email = randomEmail('reset');
  const oldPassword = 'old123456';
  const newPassword = 'new987654';

  const user = await seedTestUser({ email, password: oldPassword });

  // 1. Vào trang forgot password
  await page.goto('/forgot-password');
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByRole('button', { name: /gửi link/i }).click();

  // 2. Success screen
  await expect(page.getByText(/kiểm tra email/i)).toBeVisible();

  // 3. Trong production user nhận token qua email. Test fetch từ DB.
  // Mỗi user chỉ có 1 active token tại 1 thời điểm → findFirst() OK.
  const tokenRow = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, usedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  expect(tokenRow).toBeTruthy();

  // 4. Token trong DB là hash → cần raw token để mở reset URL
  // Trick: vì hash không reversible, ta tạo token mới và replace để test
  // (KHÔNG khả thi trong production. Đây là test workaround.)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const newHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await prisma.passwordResetToken.update({
    where: { id: tokenRow!.id },
    data: { token: newHash },
  });

  // 5. Mở reset URL với raw token
  await page.goto(`/reset-password?token=${rawToken}`);
  await expect(page.getByRole('heading', { name: /mật khẩu mới/i })).toBeVisible();

  // 6. Nhập password mới
  await page.getByPlaceholder('Mật khẩu mới').fill(newPassword);
  await page.getByPlaceholder('Nhập lại mật khẩu').fill(newPassword);
  await page.getByRole('button', { name: /đặt lại mật khẩu/i }).click();

  // 7. Success screen
  await expect(page.getByText(/đặt lại thành công/i)).toBeVisible();

  // 8. Token bị mark used
  const usedToken = await prisma.passwordResetToken.findUnique({
    where: { id: tokenRow!.id },
  });
  expect(usedToken?.usedAt).toBeTruthy();

  // 9. Tự động redirect sang login sau 2s
  await page.waitForURL('/login', { timeout: 5000 });

  // 10. Login với password mới
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/mật khẩu/i).fill(newPassword);
  await page.getByRole('button', { name: /đăng nhập/i }).click();

  await page.waitForURL('/', { timeout: 10_000 });
});

test('reset URL without token shows error', async ({ page }) => {
  await page.goto('/reset-password');
  await expect(page.getByText(/link không hợp lệ/i)).toBeVisible();
});

test('reset with invalid token fails', async ({ page }) => {
  await page.goto('/reset-password?token=this-token-does-not-exist');

  await page.getByPlaceholder('Mật khẩu mới').fill('newpass123');
  await page.getByPlaceholder('Nhập lại mật khẩu').fill('newpass123');
  await page.getByRole('button', { name: /đặt lại mật khẩu/i }).click();

  // Toast error xuất hiện
  await expect(page.getByText(/không hợp lệ|hết hạn/i)).toBeVisible({ timeout: 5000 });
});

test('forgot password silently succeeds for non-existent email', async ({ page }) => {
  // Anti-enumeration: same UX as success case
  await page.goto('/forgot-password');
  await page.getByPlaceholder(/email/i).fill('nonexistent@nowhere.com');
  await page.getByRole('button', { name: /gửi link/i }).click();

  await expect(page.getByText(/kiểm tra email/i)).toBeVisible({ timeout: 5000 });

  // KHÔNG có token nào được tạo
  const tokens = await prisma.passwordResetToken.findMany({});
  expect(tokens).toHaveLength(0);
});
