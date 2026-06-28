import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiInstructor , authErrorResponse } from '@/lib/auth-helpers';
import { createQuizSchema } from '@/lib/validations/quiz';

/**
 * POST /api/instructor/quizzes
 * Tạo quiz mới gắn với 1 lesson (1 lesson = 1 quiz)
 */
export async function POST(request: Request) {
  try {
    const user = await requireApiInstructor();
    const body = await request.json();
    const data = createQuizSchema.parse(body);

    const lesson = await prisma.lesson.findUnique({
      where: { id: data.lessonId },
      include: {
        section: { include: { course: { select: { instructorId: true } } } },
        quiz: true,
      },
    });

    if (!lesson) {
      return NextResponse.json({ message: 'Bài học không tồn tại' }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && lesson.section.course.instructorId !== user.id) {
      return NextResponse.json({ message: 'Không có quyền' }, { status: 403 });
    }

    if (lesson.quiz) {
      return NextResponse.json(
        { message: 'Bài học này đã có quiz', quizId: lesson.quiz.id },
        { status: 400 }
      );
    }

    const quiz = await prisma.quiz.create({
      data: {
        lessonId: data.lessonId,
        title: data.title,
        description: data.description || null,
      },
    });

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (err: any) {
    const authRes = authErrorResponse(err);
    if (authRes) return authRes;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
