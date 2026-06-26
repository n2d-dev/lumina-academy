import { NextResponse } from 'next/server';
import { renderWelcomeEmail } from '@/lib/email/templates/welcome';
import { renderOrderConfirmation } from '@/lib/email/templates/order-confirmation';
import { renderPasswordResetEmail } from '@/lib/email/templates/password-reset';
import { renderNewEnrollmentEmail } from '@/lib/email/templates/new-enrollment';
import { renderCourseCompletionEmail } from '@/lib/email/templates/course-completion';

/**
 * GET /api/email-preview/[template]
 *
 * Dev-only: render email templates trong browser để check styling, content.
 * KHÔNG gửi email thật.
 *
 * Available templates:
 *   /api/email-preview/welcome
 *   /api/email-preview/order-confirmation
 *   /api/email-preview/password-reset
 *   /api/email-preview/new-enrollment
 *   /api/email-preview/course-completion
 *
 * Disabled trong production để không leak email structure.
 */
export async function GET(
  _request: Request,
  { params }: { params: { template: string } }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Disabled in production' }, { status: 404 });
  }

  let html: string;

  switch (params.template) {
    case 'welcome':
      html = renderWelcomeEmail({
        userName: 'Nguyễn Văn A',
        userEmail: 'demo@example.com',
      }).html;
      break;

    case 'order-confirmation':
      html = renderOrderConfirmation({
        userName: 'Nguyễn Văn A',
        orderId: 'ORD-2026-12345',
        paymentId: 'pay_abc123',
        provider: 'momo',
        amount: 1290000 + 590000,
        paidAt: new Date(),
        courses: [
          { title: 'React.js Toàn Tập 2026: Từ Zero Đến Hero', price: 1290000 },
          { title: 'TypeScript Master Class', price: 590000 },
        ],
      }).html;
      break;

    case 'password-reset':
      html = renderPasswordResetEmail({
        userName: 'Nguyễn Văn A',
        resetUrl: 'https://lumina.academy/reset-password?token=abc123def456',
        expiresInMinutes: 30,
        requestIp: '192.168.1.100',
      }).html;
      break;

    case 'new-enrollment':
      html = renderNewEnrollmentEmail({
        instructorName: 'Trần Thị B',
        studentName: 'Nguyễn Văn A',
        studentEmail: 'student@example.com',
        courses: [
          { id: '1', title: 'React.js Toàn Tập 2026' },
          { id: '2', title: 'TypeScript Master Class' },
        ],
        totalStudents: 1247,
      }).html;
      break;

    case 'course-completion':
      html = renderCourseCompletionEmail({
        userName: 'Nguyễn Văn A',
        courseTitle: 'React.js Toàn Tập 2026: Từ Zero Đến Hero',
        courseId: '1',
        instructorName: 'Trần Thị B',
        certificateId: 'CERT-2026-ABCDEF',
        totalMinutesLearned: 1872,
      }).html;
      break;

    default:
      return NextResponse.json(
        {
          message: 'Template không tồn tại',
          available: [
            'welcome',
            'order-confirmation',
            'password-reset',
            'new-enrollment',
            'course-completion',
          ],
        },
        { status: 404 }
      );
  }

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
