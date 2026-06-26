import { resend, FROM_EMAIL, REPLY_TO, isDevMode } from './client';

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  /** HTML version — bắt buộc */
  html: string;
  /** Plain text version — optional nhưng nên có cho deliverability tốt hơn */
  text?: string;
  /** Override sender mặc định nếu cần */
  from?: string;
  /** Reply-to address */
  replyTo?: string;
  /** Tags cho analytics trong Resend dashboard */
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  /** True nếu đang dev mode, email không gửi thật */
  skipped?: boolean;
}

/**
 * Gửi 1 email qua Resend.
 *
 * - Dev mode: log ra console, không throw, return ok:true để main flow tiếp tục
 * - Production: gửi qua Resend API, retry 1 lần nếu transient error (5xx, network)
 *
 * QUAN TRỌNG: Function này KHÔNG throw. Email failures được swallow để không
 * block main flow (vd. payment đã complete → email lỗi không nên rollback payment).
 * Caller nhận về { ok: false, error } và quyết định có log/alert hay không.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const recipients = Array.isArray(input.to) ? input.to : [input.to];

  // Validate emails (basic)
  for (const email of recipients) {
    if (!email.includes('@')) {
      return { ok: false, error: `Email không hợp lệ: ${email}` };
    }
  }

  // Dev mode: log + return success
  if (isDevMode || !resend) {
    console.log(
      `\n📧 [DEV] Email không được gửi (no RESEND_API_KEY)\n` +
        `   To: ${recipients.join(', ')}\n` +
        `   Subject: ${input.subject}\n` +
        `   HTML preview: ${input.html.slice(0, 100).replace(/\n/g, ' ')}...\n`
    );
    return { ok: true, skipped: true, id: `dev-${Date.now()}` };
  }

  // Production: gửi qua Resend với retry
  const maxAttempts = 2;
  let lastError = '';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        from: input.from ?? FROM_EMAIL,
        to: recipients,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo ?? REPLY_TO,
        tags: input.tags,
      });

      if (error) {
        lastError = error.message;
        // 4xx errors (validation, quota) — không retry
        // Tên error names của Resend v4 SDK
        const nonRetryableErrors = [
          'validation_error',
          'missing_required_field',
          'missing_api_key',
          'invalid_access',
          'invalid_parameter',
          'invalid_region',
        ];
        if (nonRetryableErrors.includes(error.name as string)) {
          console.error('[email] Resend non-retryable error:', error);
          return { ok: false, error: error.message };
        }
        // 5xx hoặc unknown — retry
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 500 * attempt)); // backoff
          continue;
        }
        return { ok: false, error: error.message };
      }

      return { ok: true, id: data?.id };
    } catch (err: any) {
      lastError = err.message ?? 'Unknown error';
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
        continue;
      }
    }
  }

  console.error('[email] Send failed after retries:', lastError);
  return { ok: false, error: lastError };
}
