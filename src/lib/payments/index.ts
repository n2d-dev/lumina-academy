import { prisma } from '@/lib/db';
import { sendOrderConfirmationEmail, sendNewEnrollmentEmail } from '@/lib/email';
import type { PaymentProvider, PaymentProviderId, VerifiedCallback } from './types';
import { momoProvider } from './momo';
import { vnpayProvider } from './vnpay';

export const providers: Record<Exclude<PaymentProviderId, 'stripe'>, PaymentProvider> = {
  momo: momoProvider,
  vnpay: vnpayProvider,
};

export function getProvider(id: string): PaymentProvider | null {
  if (id === 'momo' || id === 'vnpay') return providers[id];
  return null;
}

/**
 * Shared logic chạy sau khi verify callback thành công.
 * Idempotent: gọi nhiều lần với cùng providerOrderId chỉ enroll 1 lần.
 *
 * Dùng cả từ IPN handler và Return handler — đảm bảo dù IPN tới trước hay return URL
 * tới trước, user vẫn được enroll đúng 1 lần.
 */
export async function fulfillPayment(verified: VerifiedCallback): Promise<{
  ok: boolean;
  alreadyProcessed: boolean;
  paymentId?: string;
  reason?: string;
}> {
  if (!verified.success) {
    // Mark FAILED nếu chưa COMPLETED
    const payment = await prisma.payment.findUnique({
      where: { providerOrderId: verified.providerOrderId },
    });
    if (payment && payment.status === 'PENDING') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          rawResponse: verified.raw as any,
        },
      });
    }
    return { ok: false, alreadyProcessed: false, reason: verified.message };
  }

  const payment = await prisma.payment.findUnique({
    where: { providerOrderId: verified.providerOrderId },
  });

  if (!payment) {
    return { ok: false, alreadyProcessed: false, reason: 'Payment record không tồn tại' };
  }

  // Idempotency: nếu đã COMPLETED rồi thì bỏ qua (IPN có thể retry, return URL có thể bị reload)
  if (payment.status === 'COMPLETED') {
    return { ok: true, alreadyProcessed: true, paymentId: payment.id };
  }

  // Anti-tampering: kiểm tra số tiền verify khớp với số tiền lúc tạo đơn
  if (verified.amount !== payment.amount) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        rawResponse: verified.raw as any,
      },
    });
    return {
      ok: false,
      alreadyProcessed: false,
      reason: `Số tiền không khớp: expected ${payment.amount}, got ${verified.amount}`,
    };
  }

  // Atomic: update payment + tạo enrollment + clear cart
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        providerTransactionId: verified.providerTransactionId,
        rawResponse: verified.raw as any,
      },
    }),
    ...payment.courseIds.map((courseId: string) =>
      prisma.enrollment.upsert({
        where: { userId_courseId: { userId: payment.userId, courseId } },
        create: { userId: payment.userId, courseId },
        update: {},
      })
    ),
    prisma.cartItem.deleteMany({
      where: { userId: payment.userId, courseId: { in: payment.courseIds } },
    }),
  ]);

  // ====== Send notification emails (async, không block main flow) ======
  // Quan trọng: emails sau transaction commit để không rollback nếu email fail.
  // Errors được log nhưng KHÔNG throw — payment đã thành công, không nên fail vì email.
  sendPaymentNotificationEmails(payment.id).catch((err) => {
    console.error('[fulfillPayment] Email notifications error:', err);
  });

  return { ok: true, alreadyProcessed: false, paymentId: payment.id };
}

/**
 * Gửi email confirmation cho buyer + email new-enrollment cho instructor(s).
 * Chạy async sau khi payment đã commit.
 */
async function sendPaymentNotificationEmails(paymentId: string): Promise<void> {
  // Re-query với relations cần thiết
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  if (!payment || !payment.user.email) return;

  // Lấy course details (production: prisma.course.findMany)
  const { MOCK_COURSES } = await import('@/data/courses');
  const courses = MOCK_COURSES.filter((c) => payment.courseIds.includes(c.id));

  if (courses.length === 0) return;

  // 1. Email confirmation cho buyer
  const orderEmail = await sendOrderConfirmationEmail(payment.user.email, {
    userName: payment.user.name ?? '',
    orderId: payment.providerOrderId ?? payment.id,
    paymentId: payment.id,
    provider: payment.provider as 'stripe' | 'momo' | 'vnpay',
    amount: payment.amount,
    paidAt: payment.completedAt ?? new Date(),
    courses: courses.map((c) => ({ title: c.title, price: c.price })),
  });
  if (!orderEmail.ok) {
    console.error('[email] Order confirmation failed:', orderEmail.error);
  }

  // 2. Email new-enrollment cho từng instructor (group theo instructor)
  const enrollmentsByInstructor = new Map<
    string,
    { instructorEmail: string; instructorName: string; courses: { id: string; title: string }[] }
  >();

  for (const course of courses) {
    if (!course.instructor) continue;
    // MOCK_COURSES không có instructor email → skip trong dev.
    // Production: query User table để lấy instructor email
    const instructorEmail = (course.instructor as any).email;
    if (!instructorEmail) continue;

    const existing = enrollmentsByInstructor.get(course.instructor.id);
    if (existing) {
      existing.courses.push({ id: course.id, title: course.title });
    } else {
      enrollmentsByInstructor.set(course.instructor.id, {
        instructorEmail,
        instructorName: course.instructor.name,
        courses: [{ id: course.id, title: course.title }],
      });
    }
  }

  for (const data of enrollmentsByInstructor.values()) {
    const result = await sendNewEnrollmentEmail(data.instructorEmail, {
      instructorName: data.instructorName,
      studentName: payment.user.name ?? 'Học viên',
      studentEmail: payment.user.email,
      courses: data.courses,
    });
    if (!result.ok) {
      console.error('[email] New enrollment notification failed:', result.error);
    }
  }
}
