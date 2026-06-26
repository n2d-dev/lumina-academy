import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './auth';
import { prisma } from './db';
import type { UserRole } from '@/types';

/**
 * Auth guards & helpers cho server-side
 * Dùng trong Server Components và API routes
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
