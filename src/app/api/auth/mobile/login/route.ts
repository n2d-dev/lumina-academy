/**
 * POST /api/auth/mobile/login
 * JWT-based authentication cho mobile app.
 *
 * Web dùng NextAuth session với HTTP-only cookies.
 * Mobile không thể dùng cookies → dùng JWT Bearer token thay thế.
 *
 * Security:
 *   - JWT signed với NEXTAUTH_SECRET
 *   - Expiry 30 ngày (mobile app không yêu cầu re-login thường xuyên)
 *   - Rate limit: implement bằng middleware nếu cần (TODO production)
 *   - KHÔNG lưu token trong response body cache
 *
 * Mobile lưu token bằng SecureStore (iOS Keychain / Android Keystore).
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const JWT_SECRET = process.env.NEXTAUTH_SECRET ?? 'dev-secret';
const JWT_EXPIRES_IN = '30d';

export async function POST(request: Request) {
  try {
    // Chỉ cho phép requests từ mobile app (X-Client header)
    const clientHeader = request.headers.get('X-Client');
    if (clientHeader !== 'lumina-mobile') {
      return NextResponse.json(
        { message: 'Unauthorized client' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        image: true,
      },
    });

    if (!user || !user.password) {
      // Timing-safe: vẫn hash dù không có user để tránh timing attack
      await bcrypt.compare(password, '$2a$12$dummy.hash.to.prevent.timing.attack');
      return NextResponse.json(
        { message: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { message: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // Tạo JWT
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { message: err.errors[0].message },
        { status: 400 }
      );
    }
    console.error('[mobile/login]', err);
    return NextResponse.json(
      { message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
