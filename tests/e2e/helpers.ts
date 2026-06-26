/**
 * E2E test helpers — direct DB access ngoài app process để setup state.
 *
 * Khác với integration tests, E2E test chạy browser thật → cần DB connection
 * riêng để inject test data trước khi load page.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5433/lumina_test' },
  },
});

export { prisma };

export async function cleanE2eDb() {
  await prisma.$transaction([
    prisma.lessonProgress.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export async function seedTestUser(opts: {
  email: string;
  password: string;
  name?: string;
}) {
  return prisma.user.create({
    data: {
      email: opts.email,
      name: opts.name ?? 'E2E User',
      password: await bcrypt.hash(opts.password, 4),
      role: 'STUDENT',
    },
  });
}

/** Random email để tránh test xung đột nhau */
export function randomEmail(prefix = 'e2e'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`;
}
