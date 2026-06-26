import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireCourseOwner, requireInstructor } from '@/lib/auth-helpers';
import {
  createSectionSchema,
  reorderSectionsSchema,
} from '@/lib/validations/course';

/**
 * POST /api/instructor/sections
 * Tạo section mới trong course
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createSectionSchema.parse(body);

    await requireCourseOwner(data.courseId);

    // Auto-set order = max + 1
    const lastSection = await prisma.section.findFirst({
      where: { courseId: data.courseId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const section = await prisma.section.create({
      data: {
        courseId: data.courseId,
        title: data.title,
        order: (lastSection?.order ?? 0) + 1,
      },
      include: { lessons: true },
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (err: any) {
    return handleError(err);
  }
}

/**
 * PATCH /api/instructor/sections (reorder)
 * Sắp xếp lại thứ tự sections trong course
 */
export async function PATCH(request: Request) {
  try {
    await requireInstructor();
    const body = await request.json();
    const { courseId, sectionIds } = reorderSectionsSchema.parse(body);

    await requireCourseOwner(courseId);

    // Update order trong transaction để consistency
    await prisma.$transaction(
      sectionIds.map((id, index) =>
        prisma.section.update({
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

function handleError(err: any) {
  if (err instanceof z.ZodError) {
    return NextResponse.json({ message: err.errors[0].message }, { status: 400 });
  }
  if (err.message === 'FORBIDDEN') {
    return NextResponse.json({ message: 'Không có quyền' }, { status: 403 });
  }
  return NextResponse.json({ message: err.message ?? 'Lỗi hệ thống' }, { status: 500 });
}
