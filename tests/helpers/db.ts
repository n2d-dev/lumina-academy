/**
 * Test database utilities.
 *
 * Sử dụng REAL Postgres trong Docker (docker-compose.test.yml).
 * Lý do: SQLite khác semantics với Postgres ở chỗ JSON ops, enum types,
 * concurrent transactions. Test trên thật → ít surprise khi deploy.
 *
 * Mỗi test SUITE (file) có DB riêng — set TEST_DATABASE_URL trong .env.test.
 * Mỗi test (it) tự clean trước/sau qua cleanDatabase().
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

let prismaInstance: PrismaClient | null = null;

/** Singleton Prisma client cho tests (tránh quá nhiều connections) */
export function getTestPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } },
      log: process.env.TEST_DB_LOG === '1' ? ['query', 'error'] : ['error'],
    });
  }
  return prismaInstance;
}

/**
 * Xoá toàn bộ data trong DB.
 * Dùng trong beforeEach() / afterAll() để mỗi test có state sạch.
 *
 * Thứ tự DELETE quan trọng vì có FK constraints — child trước, parent sau.
 */
export async function cleanDatabase(prisma: PrismaClient = getTestPrisma()): Promise<void> {
  // Disable FK checks tạm thời để xoá nhanh hơn (Postgres-specific)
  // Cách an toàn hơn: xoá theo đúng thứ tự dependency
  await prisma.$transaction([
    prisma.lessonProgress.deleteMany(),
    prisma.quizAttempt.deleteMany(),
    prisma.assignmentSubmission.deleteMany(),
    prisma.review.deleteMany(),
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

/**
 * Đóng connection sau khi tất cả tests xong.
 * Gọi trong afterAll() ở root.
 */
export async function disconnectTestDb(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

// ==========================================================================
// Factories — tạo test data nhanh
// ==========================================================================

let userCounter = 0;

export interface UserFactoryOptions {
  email?: string;
  name?: string;
  password?: string;
  role?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
}

/**
 * Tạo user test với password hash đúng (để test login flow).
 */
export async function createTestUser(opts: UserFactoryOptions = {}): Promise<{
  id: string;
  email: string;
  name: string;
  /** Plaintext password để test signin */
  password: string;
}> {
  const prisma = getTestPrisma();
  userCounter++;
  const email = opts.email ?? `test-user-${userCounter}-${Date.now()}@example.com`;
  const name = opts.name ?? `Test User ${userCounter}`;
  const password = opts.password ?? 'password123';

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: await bcrypt.hash(password, 4), // cost=4 cho test (vs 12 production) → 100x faster
      role: opts.role ?? 'STUDENT',
    },
  });

  return { id: user.id, email: user.email, name: user.name!, password };
}

let paymentCounter = 0;

export interface PaymentFactoryOptions {
  userId: string;
  amount?: number;
  provider?: 'stripe' | 'momo' | 'vnpay';
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  courseIds?: string[];
  providerOrderId?: string;
}

export async function createTestPayment(opts: PaymentFactoryOptions) {
  const prisma = getTestPrisma();
  paymentCounter++;
  return prisma.payment.create({
    data: {
      userId: opts.userId,
      amount: opts.amount ?? 1290000,
      currency: 'VND',
      status: opts.status ?? 'PENDING',
      provider: opts.provider ?? 'momo',
      providerOrderId: opts.providerOrderId ?? `TEST-ORDER-${paymentCounter}-${Date.now()}`,
      courseIds: opts.courseIds ?? ['1'],
    },
  });
}
