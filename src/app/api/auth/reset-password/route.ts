import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

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
        data: { password: hashedPassword },
      }),
      // Mark token used
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate tất cả session để buộc đăng nhập lại với password mới
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
