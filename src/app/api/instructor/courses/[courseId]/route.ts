import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiCourseOwner , authErrorResponse } from '@/lib/auth-helpers';
import {
  updateCourseBasicSchema,
  updateCoursePricingSchema,
  publishCourseSchema,
} from '@/lib/validations/course';

interface Params {
  params: { courseId: string };
}

/**
 * GET /api/instructor/courses/[courseId]
 * Lấy chi tiết course với sections + lessons
 */
export async function GET(_: Request, { params }: Params) {
  try {
    await requireApiCourseOwner(params.courseId);

    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      include: {
        category: true,
        instructor: true,
        sections: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' } },
          },
        },
      },
    });

    return NextResponse.json({ course });
  } catch (err: any) {
    return handleError(err);
  }
}

/**
 * PATCH /api/instructor/courses/[courseId]
 * Update course - hỗ trợ partial update theo "section":
 *   - basic: title, description, level, whatYouLearn...
 *   - pricing: price, originalPrice
 *   - status: DRAFT/PUBLISHED
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireApiCourseOwner(params.courseId);
    const body = await request.json();
    const { section, data } = body as { section: string; data: any };

    let validatedData: any;

    switch (section) {
      case 'basic':
        validatedData = updateCourseBasicSchema.parse(data);
        break;
      case 'pricing':
        validatedData = updateCoursePricingSchema.parse(data);
        break;
      case 'publish':
        validatedData = publishCourseSchema.parse(data);
        if (validatedData.status === 'PUBLISHED') {
          await validateCourseForPublish(params.courseId);
          validatedData.publishedAt = new Date();
        }
        break;
      default:
        return NextResponse.json({ message: 'Section không hợp lệ' }, { status: 400 });
    }

    const course = await prisma.course.update({
      where: { id: params.courseId },
      data: validatedData,
    });

    return NextResponse.json({ course });
  } catch (err: any) {
    return handleError(err);
  }
}

/**
 * DELETE /api/instructor/courses/[courseId]
 * Xóa course (chỉ khi chưa có enrollment)
 */
export async function DELETE(_: Request, { params }: Params) {
  try {
    await requireApiCourseOwner(params.courseId);

    const enrollmentCount = await prisma.enrollment.count({
      where: { courseId: params.courseId },
    });

    if (enrollmentCount > 0) {
      return NextResponse.json(
        { message: 'Không thể xóa khóa học đã có học viên đăng ký. Hãy archive thay vì xóa.' },
        { status: 400 }
      );
    }

    await prisma.course.delete({ where: { id: params.courseId } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return handleError(err);
  }
}

/**
 * Validate course đầy đủ trước khi publish
 */
async function validateCourseForPublish(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      sections: { include: { lessons: true } },
    },
  });

  if (!course) throw new Error('Course không tồn tại');

  const errors: string[] = [];

  if (course.title.length < 10) errors.push('Tiêu đề ít nhất 10 ký tự');
  if (course.description.length < 50) errors.push('Mô tả ít nhất 50 ký tự');
  if (course.whatYouLearn.length < 3) errors.push('Cần ít nhất 3 mục "Bạn sẽ học được"');
  if (course.sections.length === 0) errors.push('Cần ít nhất 1 chương');

  const hasLesson = course.sections.some((s) => s.lessons.length > 0);
  if (!hasLesson) errors.push('Cần ít nhất 1 bài học');

  if (errors.length > 0) {
    throw new Error('VALIDATION:' + errors.join('; '));
  }
}

function handleError(err: any) {
  const authRes = authErrorResponse(err);
  if (authRes) return authRes;
  if (err instanceof z.ZodError) {
    return NextResponse.json(
      { message: err.errors[0].message, errors: err.errors },
      { status: 400 }
    );
  }
  if (err.message === 'NOT_FOUND') {
    return NextResponse.json({ message: 'Khóa học không tồn tại' }, { status: 404 });
  }
  if (err.message === 'FORBIDDEN') {
    return NextResponse.json({ message: 'Không có quyền truy cập' }, { status: 403 });
  }
  if (err.message?.startsWith('VALIDATION:')) {
    return NextResponse.json(
      { message: err.message.replace('VALIDATION:', '') },
      { status: 400 }
    );
  }
  console.error(err);
  return NextResponse.json({ message: err.message ?? 'Lỗi hệ thống' }, { status: 500 });
}
