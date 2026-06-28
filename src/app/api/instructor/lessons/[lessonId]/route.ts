import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiInstructor , authErrorResponse } from '@/lib/auth-helpers';
import { updateLessonSchema } from '@/lib/validations/course';

interface Params {
  params: { lessonId: string };
}

async function verifyLessonOwner(lessonId: string) {
  const user = await requireApiInstructor();
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      section: { include: { course: { select: { instructorId: true, id: true } } } },
    },
  });
  if (!lesson) throw new Error('NOT_FOUND');
  if (user.role !== 'ADMIN' && lesson.section.course.instructorId !== user.id) {
    throw new Error('FORBIDDEN');
  }
  return lesson;
}

/**
 * GET /api/instructor/lessons/[lessonId]
 * Lấy thông tin chi tiết lesson, dùng cho polling video status
 */
export async function GET(_: Request, { params }: Params) {
  try {
    const lesson = await verifyLessonOwner(params.lessonId);
    return NextResponse.json({ lesson });
  } catch (err: any) {
    return handleError(err);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const lesson = await verifyLessonOwner(params.lessonId);
    const body = await request.json();
    const data = updateLessonSchema.parse(body);

    const updated = await prisma.lesson.update({
      where: { id: params.lessonId },
      data,
    });

    // duration được webhook Mux quản lý, không update ở đây

    return NextResponse.json({ lesson: updated });
  } catch (err: any) {
    return handleError(err);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const lesson = await verifyLessonOwner(params.lessonId);
    await prisma.lesson.delete({ where: { id: params.lessonId } });

    // Update count
    const totalLectures = await prisma.lesson.count({
      where: { section: { courseId: lesson.section.course.id } },
    });
    await prisma.course.update({
      where: { id: lesson.section.course.id },
      data: { totalLectures },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return handleError(err);
  }
}

function handleError(err: any) {
  const authRes = authErrorResponse(err);
  if (authRes) return authRes;
  if (err instanceof z.ZodError) {
    return NextResponse.json({ message: err.errors[0].message }, { status: 400 });
  }
  if (err.message === 'NOT_FOUND') {
    return NextResponse.json({ message: 'Không tìm thấy' }, { status: 404 });
  }
  if (err.message === 'FORBIDDEN') {
    return NextResponse.json({ message: 'Không có quyền' }, { status: 403 });
  }
  return NextResponse.json({ message: err.message }, { status: 500 });
}
