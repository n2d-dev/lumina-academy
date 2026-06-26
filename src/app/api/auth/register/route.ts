import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

const registerSchema = z.object({
  name: z.string().min(2, 'Tên ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
});

/**
 * POST /api/auth/register
 * Đăng ký user mới với email/password.
 *
 * Welcome email được gửi async sau khi tạo user thành công.
 * Email failures KHÔNG block đăng ký — user vẫn được tạo, registration trả 200.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Kiểm tra email đã tồn tại
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return NextResponse.json({ message: 'Email đã được sử dụng' }, { status: 400 });
    }

    // Hash password và tạo user
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'STUDENT',
      },
    });

    // Send welcome email (fire-and-forget, không block response)
    sendWelcomeEmail(user.email, {
      userName: user.name ?? '',
      userEmail: user.email,
    }).then((result) => {
      if (!result.ok) {
        console.error('[register] Welcome email failed:', result.error);
      }
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.errors[0].message }, { status: 400 });
    }
    console.error('Register error:', err);
    return NextResponse.json({ message: 'Lỗi hệ thống' }, { status: 500 });
  }
}
