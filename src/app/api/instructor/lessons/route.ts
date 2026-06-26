import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireInstructor } from '@/lib/auth-helpers';
import {
  createLessonSchema,
  reorderLessonsSchema,
} from '@/lib/validations/course';

async function verifySectionOwner(sectionId: string) {
  const user = await requireInstructor();
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { course: { select: { instructorId: true } } },
  });
  if (!section) throw new Error('NOT_FOUND');
  if (user.role !== 'ADMIN' && section.course.instructorId !== user.id) {
    throw new Error('FORBIDDEN');
  }
  return section;
}

/**
 * POST /api/instructor/lessons
 * Tạo lesson mới trong section
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createLessonSchema.parse(body);

    await verifySectionOwner(data.sectionId);

    const lastLesson = await prisma.lesson.findFirst({
      where: { sectionId: data.sectionId },
      orderBy: { order: 'desc' },
    });

    const lesson = await prisma.lesson.create({
      data: {
        sectionId: data.sectionId,
        title: data.title,
        order: (lastLesson?.order ?? 0) + 1,
      },
    });

    // Update tổng số lectures của course
    await updateCourseLectureCount(lesson.sectionId);

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (err: any) {
    return handleError(err);
  }
}

/**
 * PATCH /api/instructor/lessons (reorder)
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { sectionId, lessonIds } = reorderLessonsSchema.parse(body);

    await verifySectionOwner(sectionId);

    await prisma.$transaction(
      lessonIds.map((id, index) =>
        prisma.lesson.update({
          where: { id },
          data: { order: index + 1 },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return handleError(err);
  }
}

async function updateCourseLectureCount(sectionId: string) {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: { courseId: true },
  });
  if (!section) return;

  const totalLectures = await prisma.lesson.count({
    where: { section: { courseId: section.courseId } },
  });

  await prisma.course.update({
    where: { id: section.courseId },
    data: { totalLectures },
  });
}

function handleError(err: any) {
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
