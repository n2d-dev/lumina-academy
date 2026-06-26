/**
 * Tests cho sendEmail() — generic Resend wrapper.
 *
 * Tập trung edge cases:
 *   - Dev mode (no API key) → log thay vì gửi
 *   - Retry on transient errors (5xx, network)
 *   - NO retry on validation errors (4xx)
 *   - Never throws (main flow không bị break)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('sendEmail()', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('dev mode (no API key)', () => {
    beforeEach(() => {
      vi.stubEnv('RESEND_API_KEY', '');
    });

    it('returns ok:true with skipped:true when no API key', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { sendEmail } = await import('@/lib/email/send');
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      });

      expect(result.ok).toBe(true);
      expect(result.skipped).toBe(true);
      expect(result.id).toMatch(/^dev-/);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('logs preview to console in dev mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const { sendEmail } = await import('@/lib/email/send');

      await sendEmail({
        to: 'a@b.com',
        subject: 'Test Subject',
        html: '<p>Body</p>',
      });

      const logCall = consoleSpy.mock.calls[0][0] as string;
      expect(logCall).toContain('Test Subject');
      expect(logCall).toContain('a@b.com');
    });
  });

  describe('email validation', () => {
    beforeEach(() => {
      vi.stubEnv('RESEND_API_KEY', '');
    });

    it('rejects invalid email format', async () => {
      const { sendEmail } = await import('@/lib/email/send');
      const result = await sendEmail({
        to: 'not-an-email',
        subject: 'Test',
        html: '<p>x</p>',
      });
      expect(result.ok).toBe(false);
      expect(result.error).toContain('không hợp lệ');
    });

    it('accepts array of recipients', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      const { sendEmail } = await import('@/lib/email/send');
      const result = await sendEmail({
        to: ['a@b.com', 'c@d.com'],
        subject: 'Test',
        html: '<p>x</p>',
      });
      expect(result.ok).toBe(true);
    });

    it('rejects when one of multiple emails invalid', async () => {
      const { sendEmail } = await import('@/lib/email/send');
      const result = await sendEmail({
        to: ['a@b.com', 'invalid'],
        subject: 'Test',
        html: '<p>x</p>',
      });
      expect(result.ok).toBe(false);
    });
  });

  describe('production mode (with mocked Resend)', () => {
    beforeEach(() => {
      vi.stubEnv('RESEND_API_KEY', 're_test_dummy');
    });

    it('returns ok:true with id when Resend succeeds', async () => {
      // Mock Resend SDK
      vi.doMock('resend', () => ({
        Resend: vi.fn().mockImplementation(() => ({
          emails: {
            send: vi.fn().mockResolvedValue({
              data: { id: 'msg_abc123' },
              error: null,
            }),
          },
        })),
      }));

      const { sendEmail } = await import('@/lib/email/send');
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>x</p>',
      });

      expect(result.ok).toBe(true);
      expect(result.id).toBe('msg_abc123');
    });

    it('does NOT retry on validation_error', async () => {
      const sendMock = vi.fn().mockResolvedValue({
        data: null,
        error: { name: 'validation_error', message: 'Invalid recipient' },
      });

      vi.doMock('resend', () => ({
        Resend: vi.fn().mockImplementation(() => ({
          emails: { send: sendMock },
        })),
      }));

      vi.spyOn(console, 'error').mockImplementation(() => {});

      const { sendEmail } = await import('@/lib/email/send');
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'T',
        html: '<p>x</p>',
      });

      expect(result.ok).toBe(false);
      expect(sendMock).toHaveBeenCalledTimes(1); // không retry
    });

    it('retries on unknown errors', async () => {
      const sendMock = vi
        .fn()
        .mockResolvedValueOnce({
          data: null,
          error: { name: 'internal_server_error', message: 'Resend down' },
        })
        .mockResolvedValueOnce({
          data: { id: 'msg_retry_ok' },
          error: null,
        });

      vi.doMock('resend', () => ({
        Resend: vi.fn().mockImplementation(() => ({
          emails: { send: sendMock },
        })),
      }));

      const { sendEmail } = await import('@/lib/email/send');
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'T',
        html: '<p>x</p>',
      });

      expect(result.ok).toBe(true);
      expect(result.id).toBe('msg_retry_ok');
      expect(sendMock).toHaveBeenCalledTimes(2);
    });

    it('returns error after max retries', async () => {
      const sendMock = vi.fn().mockResolvedValue({
        data: null,
        error: { name: 'internal_server_error', message: 'Down' },
      });

      vi.doMock('resend', () => ({
        Resend: vi.fn().mockImplementation(() => ({
          emails: { send: sendMock },
        })),
      }));

      vi.spyOn(console, 'error').mockImplementation(() => {});

      const { sendEmail } = await import('@/lib/email/send');
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'T',
        html: '<p>x</p>',
      });

      expect(result.ok).toBe(false);
      expect(sendMock).toHaveBeenCalledTimes(2); // 2 attempts (1 + 1 retry)
    });

    it('catches thrown errors without crashing', async () => {
      const sendMock = vi.fn().mockRejectedValue(new Error('Network down'));

      vi.doMock('resend', () => ({
        Resend: vi.fn().mockImplementation(() => ({
          emails: { send: sendMock },
        })),
      }));

      vi.spyOn(console, 'error').mockImplementation(() => {});

      const { sendEmail } = await import('@/lib/email/send');
      // KEY: KHÔNG throw, return error gracefully
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'T',
        html: '<p>x</p>',
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Network down');
    });
  });
});
