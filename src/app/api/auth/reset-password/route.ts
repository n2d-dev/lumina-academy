import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

const resetSchema = z.object({
  token: z.string().min(1, 'Token là bắt buộc'),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
});

/**
 * POST /api/auth/reset-password
 * Hoàn tất flow đặt lại mật khẩu với token từ email.
 *
 * Validations:
 *   1. Token tồn tại trong DB (lookup bằng hash)
 *   2. Token chưa expired
 *   3. Token chưa được dùng (one-time use)
 *
 * Sau khi reset thành công:
 *   - Mark token là usedAt (chống reuse)
 *   - Update user password
 *   - (Optional) Invalidate tất cả sessions của user → buộc đăng nhập lại
 */
export async function POST(request: Request) {
  try {
    // Chống brute-force token: tối đa 10 lần thử / phút / IP.
    const limited = checkRateLimit(request, 'reset-password', { limit: 10, windowMs: 60_000 });
    if (limited.response) return limited.response;

    const body = await request.json();
    const { token, password } = resetSchema.parse(body);

    // Hash token nhận được để query DB (vì DB lưu hash)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
    });

    if (!resetToken) {
      return NextResponse.json(
        { message: 'Link không hợp lệ hoặc đã hết hạn' },
        { status: 400 }
      );
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        { message: 'Link này đã được sử dụng. Vui lòng yêu cầu link mới.' },
        { status: 400 }
      );
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { message: 'Link đã hết hạn. Vui lòng yêu cầu link mới.' },
        { status: 400 }
      );
    }

    // Hash password mới và update user
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        // passwordChangedAt mốc thời gian đổi mật khẩu — JWT callback (lib/auth.ts)
        // dùng nó để vô hiệu hóa mọi token phát hành TRƯỚC thời điểm này.
        // (App dùng JWT strategy, KHÔNG có Session table → không thể chỉ xóa session.)
        data: { password: hashedPassword, passwordChangedAt: new Date() },
      }),
      // Mark token used
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Best-effort: xóa DB session nếu sau này bật adapter (no-op với JWT thuần)
      prisma.session.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    return NextResponse.json({
      message: 'Mật khẩu đã được đặt lại. Vui lòng đăng nhập với mật khẩu mới.',
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.errors[0].message }, { status: 400 });
    }
    console.error('Reset password error:', err);
    return NextResponse.json({ message: 'Lỗi hệ thống' }, { status: 500 });
  }
}
