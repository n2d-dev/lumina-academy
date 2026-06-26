/**
 * Integration tests cho auth flows:
 *   - POST /api/auth/register
 *   - POST /api/auth/forgot-password
 *   - POST /api/auth/reset-password
 *
 * Test full lifecycle với real DB.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
  getTestPrisma,
  cleanDatabase,
  disconnectTestDb,
  createTestUser,
} from '../../helpers/db';

// Mock email
vi.mock('@/lib/email', () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue({ ok: true, id: 'mock' }),
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ ok: true, id: 'mock' }),
}));

// Mock Next.js headers() — pure unit-style, không thực sự cần request
vi.mock('next/headers', () => ({
  headers: () => ({
    get: (k: string) => (k === 'x-forwarded-for' ? '127.0.0.1' : null),
  }),
}));

const prisma = getTestPrisma();

describe('Auth Integration', () => {
  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;
  });

  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('POST /api/auth/register', () => {
    it('creates user with hashed password', async () => {
      const { POST } = await import('@/app/api/auth/register/route');
      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New User',
          email: 'newuser@test.com',
          password: 'secret123',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.email).toBe('newuser@test.com');
      expect(data.id).toBeTruthy();

      const dbUser = await prisma.user.findUnique({
        where: { email: 'newuser@test.com' },
      });
      expect(dbUser).toBeTruthy();
      // Password phải được hash
      expect(dbUser?.password).not.toBe('secret123');
      expect(await bcrypt.compare('secret123', dbUser!.password!)).toBe(true);
      expect(dbUser?.role).toBe('STUDENT');
    });

    it('rejects duplicate email', async () => {
      await createTestUser({ email: 'taken@test.com' });

      const { POST } = await import('@/app/api/auth/register/route');
      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Other',
          email: 'taken@test.com',
          password: 'pass1234',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.message).toContain('đã được sử dụng');
    });

    it('rejects invalid email format', async () => {
      const { POST } = await import('@/app/api/auth/register/route');
      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'X',
          email: 'not-an-email',
          password: 'pass1234',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('rejects short password', async () => {
      const { POST } = await import('@/app/api/auth/register/route');
      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'X',
          email: 'x@test.com',
          password: '12345', // < 6 chars
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('triggers welcome email (fire-and-forget)', async () => {
      const { sendWelcomeEmail } = await import('@/lib/email');
      const { POST } = await import('@/app/api/auth/register/route');

      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New',
          email: 'welcomenew@test.com',
          password: 'pass1234',
        }),
      });

      await POST(req);
      // Cho fire-and-forget promise resolve
      await new Promise((r) => setTimeout(r, 50));

      expect(sendWelcomeEmail).toHaveBeenCalledWith(
        'welcomenew@test.com',
        expect.objectContaining({ userName: 'New', userEmail: 'welcomenew@test.com' })
      );
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('creates reset token + sends email when email exists', async () => {
      const { sendPasswordResetEmail } = await import('@/lib/email');
      await createTestUser({ email: 'exists@test.com', name: 'Real User' });

      const { POST } = await import('@/app/api/auth/forgot-password/route');
      const req = new Request('http://localhost/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'exists@test.com' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      // Token được tạo
      const tokens = await prisma.passwordResetToken.findMany({});
      expect(tokens).toHaveLength(1);
      expect(tokens[0].usedAt).toBeNull();
      expect(tokens[0].expiresAt > new Date()).toBe(true);

      // Email được gửi với resetUrl chứa token RAW (không phải hash)
      expect(sendPasswordResetEmail).toHaveBeenCalled();
      const emailArgs = (sendPasswordResetEmail as any).mock.calls[0][1];
      expect(emailArgs.resetUrl).toContain('token=');

      // Token trong DB là HASH, không phải raw
      const rawTokenFromUrl = new URL(emailArgs.resetUrl).searchParams.get('token')!;
      const expectedHash = crypto.createHash('sha256').update(rawTokenFromUrl).digest('hex');
      expect(tokens[0].token).toBe(expectedHash);
    });

    it('returns 200 even when email does not exist (anti-enumeration)', async () => {
      const { sendPasswordResetEmail } = await import('@/lib/email');

      const { POST } = await import('@/app/api/auth/forgot-password/route');
      const req = new Request('http://localhost/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'nonexistent@test.com' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200); // KEY: vẫn 200

      // Không tạo token
      const tokens = await prisma.passwordResetToken.findMany({});
      expect(tokens).toHaveLength(0);

      // Không gửi email
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('invalidates old tokens when requesting new reset', async () => {
      const user = await createTestUser({ email: 'multi@test.com' });

      // Tạo 1 token cũ
      await prisma.passwordResetToken.create({
        data: {
          token: 'old-hash',
          userId: user.id,
          expiresAt: new Date(Date.now() + 60_000),
        },
      });

      const { POST } = await import('@/app/api/auth/forgot-password/route');
      await POST(
        new Request('http://localhost/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: 'multi@test.com' }),
        })
      );

      // Token cũ bị xoá
      const tokens = await prisma.passwordResetToken.findMany({
        where: { userId: user.id },
      });
      expect(tokens).toHaveLength(1);
      expect(tokens[0].token).not.toBe('old-hash');
    });

    it('rejects invalid email format', async () => {
      const { POST } = await import('@/app/api/auth/forgot-password/route');
      const res = await POST(
        new Request('http://localhost/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: 'invalid' }),
        })
      );
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    /** Tạo user + reset token, trả về token RAW để test */
    async function setupResetToken(opts?: {
      expiresAt?: Date;
      usedAt?: Date | null;
    }) {
      const user = await createTestUser();
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      await prisma.passwordResetToken.create({
        data: {
          token: hashedToken,
          userId: user.id,
          expiresAt: opts?.expiresAt ?? new Date(Date.now() + 30 * 60 * 1000),
          usedAt: opts?.usedAt ?? null,
        },
      });

      return { user, rawToken };
    }

    it('resets password with valid token', async () => {
      const { user, rawToken } = await setupResetToken();

      const { POST } = await import('@/app/api/auth/reset-password/route');
      const res = await POST(
        new Request('http://localhost/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token: rawToken, password: 'newpassword' }),
        })
      );

      expect(res.status).toBe(200);

      const updated = await prisma.user.findUnique({ where: { id: user.id } });
      expect(await bcrypt.compare('newpassword', updated!.password!)).toBe(true);

      // Old password no longer works
      expect(await bcrypt.compare(user.password, updated!.password!)).toBe(false);
    });

    it('marks token as used after successful reset', async () => {
      const { rawToken } = await setupResetToken();
      const { POST } = await import('@/app/api/auth/reset-password/route');
      await POST(
        new Request('http://localhost/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token: rawToken, password: 'newpass1' }),
        })
      );

      const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const token = await prisma.passwordResetToken.findUnique({
        where: { token: hash },
      });
      expect(token?.usedAt).toBeTruthy();
    });

    it('rejects already-used token (one-time use)', async () => {
      const { rawToken } = await setupResetToken({
        usedAt: new Date(),
      });

      const { POST } = await import('@/app/api/auth/reset-password/route');
      const res = await POST(
        new Request('http://localhost/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token: rawToken, password: 'newpass1' }),
        })
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.message).toContain('đã được sử dụng');
    });

    it('rejects expired token', async () => {
      const { rawToken } = await setupResetToken({
        expiresAt: new Date(Date.now() - 1000), // expired 1 second ago
      });

      const { POST } = await import('@/app/api/auth/reset-password/route');
      const res = await POST(
        new Request('http://localhost/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token: rawToken, password: 'newpass1' }),
        })
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.message).toContain('hết hạn');
    });

    it('rejects invalid (non-existent) token', async () => {
      const { POST } = await import('@/app/api/auth/reset-password/route');
      const res = await POST(
        new Request('http://localhost/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({
            token: 'fake-token-that-does-not-exist',
            password: 'newpass1',
          }),
        })
      );
      expect(res.status).toBe(400);
    });

    it('invalidates all user sessions after reset', async () => {
      const { user, rawToken } = await setupResetToken();

      // Tạo 2 sessions cho user
      await prisma.session.create({
        data: {
          sessionToken: 'session-1',
          userId: user.id,
          expires: new Date(Date.now() + 86400000),
        },
      });
      await prisma.session.create({
        data: {
          sessionToken: 'session-2',
          userId: user.id,
          expires: new Date(Date.now() + 86400000),
        },
      });

      const { POST } = await import('@/app/api/auth/reset-password/route');
      await POST(
        new Request('http://localhost/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token: rawToken, password: 'newpass1' }),
        })
      );

      // All sessions deleted
      const sessions = await prisma.session.findMany({ where: { userId: user.id } });
      expect(sessions).toHaveLength(0);
    });

    it('rejects short password', async () => {
      const { rawToken } = await setupResetToken();
      const { POST } = await import('@/app/api/auth/reset-password/route');
      const res = await POST(
        new Request('http://localhost/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token: rawToken, password: '123' }),
        })
      );
      expect(res.status).toBe(400);
    });
  });
});
