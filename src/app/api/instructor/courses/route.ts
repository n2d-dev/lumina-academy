import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireInstructor } from '@/lib/auth-helpers';
import { createCourseSchema } from '@/lib/validations/course';
import { slugify } from '@/lib/utils';

/**
 * GET /api/instructor/courses
 * Lấy danh sách courses của instructor đang đăng nhập
 */
export async function GET() {
  try {
    const user = await requireInstructor();

    const courses = await prisma.course.findMany({
      where: user.role === 'ADMIN' ? {} : { instructorId: user.id },
      include: {
        category: true,
        _count: { select: { enrollments: true, sections: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ courses });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

/**
 * POST /api/instructor/courses
 * Tạo course mới (DRAFT status)
 */
export async function POST(request: Request) {
  try {
    const user = await requireInstructor();
    const body = await request.json();
    const data = createCourseSchema.parse(body);

    // Tạo slug unique
    const baseSlug = slugify(data.title);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.course.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    // Form gửi slug (vd: "programming"), cần resolve sang real DB ID
    const category = await prisma.category.findUnique({
      where: { slug: data.categoryId },
    });
    if (!category) {
      return NextResponse.json({ message: 'Danh mục không tồn tại' }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        title: data.title,
        slug,
        description: '',
        categoryId: category.id,
        instructorId: user.id,
        status: 'DRAFT',
        whatYouLearn: [],
        requirements: [],
        targetAudience: [],
        price: 0,
      },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { message: err.errors[0].message, errors: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: err.message ?? 'Lỗi hệ thống' }, { status: 500 });
  }
}
