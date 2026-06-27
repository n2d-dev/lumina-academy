import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';
import { prisma } from './db';
import type { UserRole } from '@/types';

type SessionUser = { id: string; email: string; name: string; role: UserRole };

/**
 * Auth guards & helpers cho server-side.
 *
 * Có 2 nhóm guard:
 *   - require*       : dùng trong SERVER COMPONENTS/PAGES — redirect() khi fail.
 *   - requireApi*    : dùng trong API ROUTE HANDLERS — throw typed error
 *                      ('UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND') để route trả
 *                      đúng HTTP status. KHÔNG dùng redirect() trong API route vì
 *                      NEXT_REDIRECT sẽ bị try/catch nuốt và biến thành 500.
 */

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user as { id: string; email: string; name: string; role: UserRole };
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect('/');
  }
  return user;
}

export async function requireInstructor() {
  return requireRole(['INSTRUCTOR', 'ADMIN']);
}

/**
 * Verify user owns the course
 * Throw error nếu không phải owner (trừ ADMIN)
 */
export async function requireCourseOwner(courseId: string) {
  const user = await requireInstructor();

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, instructorId: true, status: true },
  });

  if (!course) {
    throw new Error('NOT_FOUND');
  }

  if (user.role !== 'ADMIN' && course.instructorId !== user.id) {
    throw new Error('FORBIDDEN');
  }

  return { user, course };
}

/* ====================== API-route guards (throw, không redirect) ====================== */

export async function requireApiUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user as SessionUser;
}

export async function requireApiRole(roles: UserRole[]): Promise<SessionUser> {
  const user = await requireApiUser();
  if (!roles.includes(user.role)) {
    throw new Error('FORBIDDEN');
  }
  return user;
}

export async function requireApiInstructor(): Promise<SessionUser> {
  return requireApiRole(['INSTRUCTOR', 'ADMIN']);
}

export async function requireApiCourseOwner(courseId: string) {
  const user = await requireApiInstructor();

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, instructorId: true, status: true },
  });

  if (!course) throw new Error('NOT_FOUND');
  if (user.role !== 'ADMIN' && course.instructorId !== user.id) {
    throw new Error('FORBIDDEN');
  }

  return { user, course };
}

/**
 * Map typed auth error ('UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND') sang HTTP
 * response chuẩn cho API route. Trả về null nếu không phải auth error → caller
 * tự xử lý (ZodError / 500). Đặt ở ĐẦU mỗi catch/handleError.
 */
export function authErrorResponse(err: unknown): NextResponse | null {
  const message = err instanceof Error ? err.message : '';
  switch (message) {
    case 'UNAUTHORIZED':
      return NextResponse.json({ message: 'Vui lòng đăng nhập' }, { status: 401 });
    case 'FORBIDDEN':
      return NextResponse.json({ message: 'Không có quyền' }, { status: 403 });
    case 'NOT_FOUND':
      return NextResponse.json({ message: 'Không tìm thấy' }, { status: 404 });
    default:
      return null;
  }
}
