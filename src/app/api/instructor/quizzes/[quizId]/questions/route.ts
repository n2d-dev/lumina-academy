import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiInstructor , authErrorResponse } from '@/lib/auth-helpers';
import {
  createQuestionSchema,
  reorderQuestionsSchema,
} from '@/lib/validations/quiz';

interface Params {
  params: { quizId: string };
}

async function verifyQuizOwner(quizId: string, userId: string, role: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      lesson: { include: { section: { include: { course: true } } } },
    },
  });
  if (!quiz) throw new Error('NOT_FOUND');
  if (role !== 'ADMIN' && quiz.lesson.section.course.instructorId !== userId) {
    throw new Error('FORBIDDEN');
  }
  return quiz;
}

/**
 * POST /api/instructor/quizzes/[quizId]/questions
 * Tạo question mới trong quiz
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireApiInstructor();
    const body = await request.json();
    const data = createQuestionSchema.parse({ ...body, quizId: params.quizId });

    await verifyQuizOwner(params.quizId, user.id, user.role);

    const lastQuestion = await prisma.question.findFirst({
      where: { quizId: params.quizId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const question = await prisma.question.create({
      data: {
        quizId: params.quizId,
        type: data.type,
        text: data.text,
        explanation: data.explanation || null,
        points: data.points,
        options: data.options as any,
        order: (lastQuestion?.order ?? 0) + 1,
      },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (err: any) {
    return handleError(err);
  }
}

/**
 * PATCH /api/instructor/quizzes/[quizId]/questions
 * Reorder questions trong quiz
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireApiInstructor();
    const body = await request.json();
    const data = reorderQuestionsSchema.parse({
      ...body,
      quizId: params.quizId,
    });

    await verifyQuizOwner(params.quizId, user.id, user.role);

    // updateMany + ràng buộc quizId → chỉ cập nhật question THUỘC quiz này,
    // chống IDOR (ID lạ bị bỏ qua thay vì ghi đè question của quiz khác).
    await prisma.$transaction(
      data.questionIds.map((id, index) =>
        prisma.question.updateMany({
          where: { id, quizId: params.quizId },
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
  const authRes = authErrorResponse(err);
  if (authRes) return authRes;
  if (err instanceof z.ZodError) {
    return NextResponse.json(
      { message: err.errors[0].message, errors: err.errors },
      { status: 400 }
    );
  }
  if (err.message === 'NOT_FOUND') {
    return NextResponse.json({ message: 'Không tìm thấy' }, { status: 404 });
  }
  if (err.message === 'FORBIDDEN') {
    return NextResponse.json({ message: 'Không có quyền' }, { status: 403 });
  }
  return NextResponse.json({ message: err.message }, { status: 500 });
}
