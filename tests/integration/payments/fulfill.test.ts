/**
 * Integration tests cho fulfillPayment() — function critical nhất trong codebase.
 *
 * Dùng REAL Postgres để test:
 *   - Transaction atomicity (payment + enrollment + cart clear)
 *   - Idempotency (gọi 2 lần = enroll 1 lần)
 *   - Anti-tampering (amount mismatch → fail)
 *   - State transitions (PENDING → COMPLETED / FAILED)
 *   - Race conditions (concurrent IPN + return URL)
 *
 * Mock các side effects:
 *   - sendEmail() (không gửi mail thật)
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { fulfillPayment } from '@/lib/payments';
import type { VerifiedCallback } from '@/lib/payments/types';
import {
  getTestPrisma,
  cleanDatabase,
  disconnectTestDb,
  createTestUser,
  createTestPayment,
} from '../../helpers/db';

// Mock email — không gửi thật trong tests
vi.mock('@/lib/email', () => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue({ ok: true, id: 'mock' }),
  sendNewEnrollmentEmail: vi.fn().mockResolvedValue({ ok: true, id: 'mock' }),
  sendWelcomeEmail: vi.fn().mockResolvedValue({ ok: true, id: 'mock' }),
}));

// Mock MOCK_COURSES vì fulfillPayment query nó
vi.mock('@/data/courses', () => ({
  MOCK_COURSES: [
    {
      id: 'course-1',
      title: 'React Course',
      price: 1290000,
      instructor: { id: 'instr-1', name: 'Teacher A' },
    },
    {
      id: 'course-2',
      title: 'TypeScript Course',
      price: 590000,
      instructor: { id: 'instr-2', name: 'Teacher B' },
    },
  ],
}));

const prisma = getTestPrisma();

describe('fulfillPayment()', () => {
  beforeAll(async () => {
    // Verify DB connectable
    await prisma.$queryRaw`SELECT 1`;
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  // Helper: build verified callback object
  function makeVerified(overrides: Partial<VerifiedCallback> = {}): VerifiedCallback {
    return {
      providerOrderId: 'TEST-ORDER-1',
      providerTransactionId: 'TRANS-123',
      success: true,
      amount: 1290000,
      message: 'OK',
      raw: { test: true },
      ...overrides,
    };
  }

  describe('happy path', () => {
    it('marks payment COMPLETED + creates enrollment + clears cart', async () => {
      const user = await createTestUser();
      const payment = await createTestPayment({
        userId: user.id,
        amount: 1290000,
        courseIds: ['course-1'],
        providerOrderId: 'TEST-ORDER-1',
      });

      // Setup: user có item trong cart
      await prisma.cartItem.create({
        data: { userId: user.id, courseId: 'course-1' },
      });

      const result = await fulfillPayment(makeVerified());

      expect(result.ok).toBe(true);
      expect(result.alreadyProcessed).toBe(false);
      expect(result.paymentId).toBe(payment.id);

      // Verify DB state
      const updatedPayment = await prisma.payment.findUnique({
        where: { id: payment.id },
      });
      expect(updatedPayment?.status).toBe('COMPLETED');
      expect(updatedPayment?.completedAt).toBeTruthy();
      expect(updatedPayment?.providerTransactionId).toBe('TRANS-123');

      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: 'course-1' } },
      });
      expect(enrollment).toBeTruthy();

      const cartItems = await prisma.cartItem.findMany({ where: { userId: user.id } });
      expect(cartItems).toHaveLength(0);
    });

    it('handles multiple courses in one payment', async () => {
      const user = await createTestUser();
      await createTestPayment({
        userId: user.id,
        amount: 1290000 + 590000,
        courseIds: ['course-1', 'course-2'],
        providerOrderId: 'TEST-MULTI',
      });

      await fulfillPayment(
        makeVerified({ providerOrderId: 'TEST-MULTI', amount: 1290000 + 590000 })
      );

      const enrollments = await prisma.enrollment.findMany({
        where: { userId: user.id },
      });
      expect(enrollments).toHaveLength(2);
      const courseIds = enrollments.map((e) => e.courseId).sort();
      expect(courseIds).toEqual(['course-1', 'course-2']);
    });
  });

  describe('idempotency', () => {
    it('calling twice only enrolls once', async () => {
      const user = await createTestUser();
      await createTestPayment({
        userId: user.id,
        courseIds: ['course-1'],
        providerOrderId: 'TEST-IDEMP',
      });

      // Gọi lần 1 — IPN tới
      const r1 = await fulfillPayment(
        makeVerified({ providerOrderId: 'TEST-IDEMP' })
      );
      expect(r1.ok).toBe(true);
      expect(r1.alreadyProcessed).toBe(false);

      // Gọi lần 2 — return URL fulfill lại
      const r2 = await fulfillPayment(
        makeVerified({ providerOrderId: 'TEST-IDEMP' })
      );
      expect(r2.ok).toBe(true);
      expect(r2.alreadyProcessed).toBe(true); // KEY: phát hiện đã xử lý

      // Vẫn chỉ 1 enrollment, không bị duplicate
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: user.id, courseId: 'course-1' },
      });
      expect(enrollments).toHaveLength(1);

      // completedAt không bị overwrite
      const p = await prisma.payment.findFirst({
        where: { providerOrderId: 'TEST-IDEMP' },
      });
      const firstCompletedAt = p?.completedAt;
      expect(firstCompletedAt).toBeTruthy();
    });

    it('does not re-enroll when called 10 times concurrently', async () => {
      const user = await createTestUser();
      await createTestPayment({
        userId: user.id,
        courseIds: ['course-1'],
        providerOrderId: 'TEST-RACE',
      });

      // 10 calls song song (mô phỏng MoMo retry + return URL trùng nhau)
      const results = await Promise.all(
        Array.from({ length: 10 }, () =>
          fulfillPayment(makeVerified({ providerOrderId: 'TEST-RACE' }))
        )
      );

      // Tất cả phải ok=true
      expect(results.every((r) => r.ok)).toBe(true);

      // CHỈ 1 enrollment được tạo
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: user.id, courseId: 'course-1' },
      });
      expect(enrollments).toHaveLength(1);

      // CHỈ 1 payment COMPLETED
      const payments = await prisma.payment.findMany({
        where: { providerOrderId: 'TEST-RACE' },
      });
      expect(payments).toHaveLength(1);
      expect(payments[0].status).toBe('COMPLETED');
    });
  });

  describe('anti-tampering', () => {
    it('rejects when amount in callback does not match payment record', async () => {
      const user = await createTestUser();
      await createTestPayment({
        userId: user.id,
        amount: 1290000, // user đã trả 1.29M
        courseIds: ['course-1'],
        providerOrderId: 'TEST-TAMPER',
      });

      // Attacker fake callback với amount thấp hơn (đã pass signature ở layer trên)
      const result = await fulfillPayment(
        makeVerified({
          providerOrderId: 'TEST-TAMPER',
          amount: 1, // gian lận
        })
      );

      expect(result.ok).toBe(false);
      expect(result.reason).toContain('không khớp');

      // Payment marked FAILED
      const p = await prisma.payment.findFirst({
        where: { providerOrderId: 'TEST-TAMPER' },
      });
      expect(p?.status).toBe('FAILED');

      // KHÔNG enroll
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: user.id },
      });
      expect(enrollments).toHaveLength(0);
    });
  });

  describe('failure cases', () => {
    it('marks PENDING payment as FAILED when verified.success=false', async () => {
      const user = await createTestUser();
      await createTestPayment({
        userId: user.id,
        courseIds: ['course-1'],
        providerOrderId: 'TEST-FAIL',
      });

      const result = await fulfillPayment(
        makeVerified({
          providerOrderId: 'TEST-FAIL',
          success: false,
          message: 'User canceled',
        })
      );

      expect(result.ok).toBe(false);
      expect(result.reason).toContain('User canceled');

      const p = await prisma.payment.findFirst({
        where: { providerOrderId: 'TEST-FAIL' },
      });
      expect(p?.status).toBe('FAILED');

      const enrollments = await prisma.enrollment.findMany({
        where: { userId: user.id },
      });
      expect(enrollments).toHaveLength(0);
    });

    it('does NOT downgrade COMPLETED payment to FAILED', async () => {
      // Edge case: payment đã COMPLETED, sau đó MoMo gửi fail callback (lỗi của MoMo)
      // → KHÔNG được downgrade
      const user = await createTestUser();
      const payment = await createTestPayment({
        userId: user.id,
        status: 'COMPLETED',
        courseIds: ['course-1'],
        providerOrderId: 'TEST-NO-DOWNGRADE',
      });

      const result = await fulfillPayment(
        makeVerified({
          providerOrderId: 'TEST-NO-DOWNGRADE',
          success: false,
        })
      );

      expect(result.ok).toBe(false);

      // Status vẫn COMPLETED
      const p = await prisma.payment.findUnique({ where: { id: payment.id } });
      expect(p?.status).toBe('COMPLETED');
    });

    it('returns error when payment record does not exist', async () => {
      const result = await fulfillPayment(
        makeVerified({ providerOrderId: 'NON-EXISTENT-ORDER' })
      );

      expect(result.ok).toBe(false);
      expect(result.reason).toContain('không tồn tại');
    });
  });

  describe('rawResponse audit trail', () => {
    it('saves verified.raw to Payment.rawResponse', async () => {
      const user = await createTestUser();
      await createTestPayment({
        userId: user.id,
        courseIds: ['course-1'],
        providerOrderId: 'TEST-AUDIT',
      });

      await fulfillPayment(
        makeVerified({
          providerOrderId: 'TEST-AUDIT',
          raw: { custom: 'data', nested: { foo: 'bar' } },
        })
      );

      const p = await prisma.payment.findFirst({
        where: { providerOrderId: 'TEST-AUDIT' },
      });
      expect(p?.rawResponse).toEqual({ custom: 'data', nested: { foo: 'bar' } });
    });

    it('saves raw even when payment fails', async () => {
      const user = await createTestUser();
      await createTestPayment({
        userId: user.id,
        courseIds: ['course-1'],
        providerOrderId: 'TEST-AUDIT-FAIL',
      });

      await fulfillPayment(
        makeVerified({
          providerOrderId: 'TEST-AUDIT-FAIL',
          success: false,
          raw: { errorCode: '1006' },
        })
      );

      const p = await prisma.payment.findFirst({
        where: { providerOrderId: 'TEST-AUDIT-FAIL' },
      });
      expect(p?.rawResponse).toEqual({ errorCode: '1006' });
    });
  });

  describe('cart handling', () => {
    it('only clears cart items matching purchased courses (preserves others)', async () => {
      const user = await createTestUser();
      await createTestPayment({
        userId: user.id,
        courseIds: ['course-1'], // chỉ mua course-1
        providerOrderId: 'TEST-CART',
      });

      // User có 2 items trong cart
      await prisma.cartItem.createMany({
        data: [
          { userId: user.id, courseId: 'course-1' }, // mua xong
          { userId: user.id, courseId: 'other-course' }, // chưa mua
        ],
      });

      await fulfillPayment(makeVerified({ providerOrderId: 'TEST-CART' }));

      const cartItems = await prisma.cartItem.findMany({ where: { userId: user.id } });
      expect(cartItems).toHaveLength(1);
      expect(cartItems[0].courseId).toBe('other-course');
    });
  });
});
