import { Resend } from 'resend';

/**
 * Resend client.
 *
 * Dev mode (no RESEND_API_KEY): emails được log ra console thay vì gửi thật,
 * giúp dev test flow mà không tốn quota.
 *
 * Production: cần set RESEND_API_KEY trong env. Tạo key tại https://resend.com/api-keys
 *
 * Free tier: 3,000 emails/tháng, 100 emails/ngày — đủ cho MVP.
 * Để gửi từ domain custom (vd. noreply@lumina.com), cần verify domain
 * tại https://resend.com/domains (add SPF + DKIM records).
 *
 * Khi chưa verify domain, dùng onboarding@resend.dev (chỉ gửi được tới
 * email đã đăng ký Resend account → KHÔNG dùng được production).
 */

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

export const FROM_EMAIL = process.env.EMAIL_FROM ?? 'Lumina Academy <noreply@lumina.academy>';
export const REPLY_TO = process.env.EMAIL_REPLY_TO ?? 'support@lumina.academy';

/** True nếu đang chạy dev mode (chưa setup Resend) */
export const isDevMode = !apiKey;

if (isDevMode && process.env.NODE_ENV !== 'test') {
  console.warn(
    '[email] RESEND_API_KEY chưa được set. Emails sẽ chỉ log ra console, không gửi thật.\n' +
      '  → Đăng ký tại https://resend.com và set RESEND_API_KEY trong .env'
  );
}
