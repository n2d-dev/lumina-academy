/**
 * Public email API.
 *
 * Tất cả nơi khác trong codebase chỉ nên import từ '@/lib/email'
 * (không import trực tiếp từ templates/ hay client.ts).
 *
 * Mỗi function:
 *   - Nhận structured data, không cần biết HTML
 *   - Return Promise<SendEmailResult> (KHÔNG throw)
 *   - Log error nếu fail nhưng không crash main flow
 *
 * Pattern dùng:
 *   const result = await sendOrderConfirmationEmail(data);
 *   if (!result.ok) {
 *     console.error('Email failed:', result.error);
 *     // KHÔNG return / throw — main flow tiếp tục bình thường
 *   }
 */

import { sendEmail, type SendEmailResult } from './send';
import {
  renderWelcomeEmail,
  type WelcomeEmailData,
} from './templates/welcome';
import {
  renderOrderConfirmation,
  type OrderConfirmationData,
} from './templates/order-confirmation';
import {
  renderPasswordResetEmail,
  type PasswordResetEmailData,
} from './templates/password-reset';
import {
  renderNewEnrollmentEmail,
  type NewEnrollmentEmailData,
} from './templates/new-enrollment';
import {
  renderCourseCompletionEmail,
  type CourseCompletionEmailData,
} from './templates/course-completion';

export type { SendEmailResult } from './send';

export async function sendWelcomeEmail(
  to: string,
  data: WelcomeEmailData
): Promise<SendEmailResult> {
  const { html, text } = renderWelcomeEmail(data);
  return sendEmail({
    to,
    subject: `Chào mừng đến với Lumina Academy, ${data.userName}!`,
    html,
    text,
    tags: [{ name: 'category', value: 'welcome' }],
  });
}

export async function sendOrderConfirmationEmail(
  to: string,
  data: OrderConfirmationData
): Promise<SendEmailResult> {
  const { html, text, subject } = renderOrderConfirmation(data);
  return sendEmail({
    to,
    subject,
    html,
    text,
    tags: [
      { name: 'category', value: 'order_confirmation' },
      { name: 'provider', value: data.provider },
    ],
  });
}

export async function sendPasswordResetEmail(
  to: string,
  data: PasswordResetEmailData
): Promise<SendEmailResult> {
  const { html, text } = renderPasswordResetEmail(data);
  return sendEmail({
    to,
    subject: 'Đặt lại mật khẩu Lumina Academy',
    html,
    text,
    tags: [{ name: 'category', value: 'password_reset' }],
  });
}

export async function sendNewEnrollmentEmail(
  to: string,
  data: NewEnrollmentEmailData
): Promise<SendEmailResult> {
  const { html, text, subject } = renderNewEnrollmentEmail(data);
  return sendEmail({
    to,
    subject,
    html,
    text,
    tags: [{ name: 'category', value: 'new_enrollment' }],
  });
}

export async function sendCourseCompletionEmail(
  to: string,
  data: CourseCompletionEmailData
): Promise<SendEmailResult> {
  const { html, text, subject } = renderCourseCompletionEmail(data);
  return sendEmail({
    to,
    subject,
    html,
    text,
    tags: [{ name: 'category', value: 'course_completion' }],
  });
}
