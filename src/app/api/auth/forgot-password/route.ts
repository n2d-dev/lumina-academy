import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

const forgotSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

const TOKEN_TTL_MINUTES = 30;

/**
 * POST /api/auth/forgot-password
 * Bắt đầu flow đặt lại mật khẩu.
 *
 * Security considerations:
 *   - Luôn trả 200 OK kể cả khi email không tồn tại → tránh email enumeration attack
 *     (attacker không thể detect email nào đã đăng ký bằng cách thử forgot-password)
 *   - Token raw được gửi qua email, nhưng DB chỉ lưu HASH (SHA-256) → nếu DB leak,
 *     attacker không có token raw để dùng
 *   - Token TTL 30 phút (có thể adjust)
 *   - Mỗi user chỉ giữ 1 active token tại 1 thời điểm — request mới invalidate token cũ
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = forgotSchema.parse(body);

    const headersList = headers();
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0].trim() ??
      headersList.get('x-real-ip') ??
      undefined;

    const user = await prisma.user.findUnique({ where: { email } });

    // Anti-enumeration: trả về cùng response dù user có tồn tại hay không
    // Vẫn cố tình await DB ops với fake delay để tránh timing attack
    if (!user) {
      // Fake delay ngẫu nhiên 100-300ms
      await new Promise((r) => setTimeout(r, 100 + Math.random() * 200));
      return NextResponse.json({
        message: 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi.',
      });
    }

    // Generate token raw (32 bytes = 64 hex chars, đủ entropy)
    const tokenRaw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');

    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

    // Invalidate tất cả token cũ của user (chống token reuse + đỡ rác DB)
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    await prisma.passwordResetToken.create({
      data: {
        token: tokenHash,
        userId: user.id,
        expiresAt,
        ipAddress,
      },
    });

    // Build reset URL với token RAW (không phải hash)
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${tokenRaw}`;

    // Send email — không block response nếu fail
    const emailResult = await sendPasswordResetEmail(user.email, {
      userName: user.name ?? '',
      resetUrl,
      expiresInMinutes: TOKEN_TTL_MINUTES,
      requestIp: ipAddress,
    });

    if (!emailResult.ok) {
      console.error('[forgot-password] Email failed:', emailResult.error);
      // Vẫn trả 200 để không leak thông tin
    }

    return NextResponse.json({
      message: 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi.',
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.errors[0].message }, { status: 400 });
    }
    console.error('Forgot password error:', err);
    return NextResponse.json({ message: 'Lỗi hệ thống' }, { status: 500 });
  }
}
