import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiInstructor , authErrorResponse } from '@/lib/auth-helpers';
import { updateQuestionSchema } from '@/lib/validations/quiz';

interface Params {
  params: { questionId: string };
}

async function verifyQuestionOwner(questionId: string) {
  const user = await requireApiInstructor();
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      quiz: {
        include: {
          lesson: { include: { section: { include: { course: true } } } },
        },
      },
    },
  });
  if (!question) throw new Error('NOT_FOUND');
  if (
    user.role !== 'ADMIN' &&
    question.quiz.lesson.section.course.instructorId !== user.id
  ) {
    throw new Error('FORBIDDEN');
  }
  return question;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await verifyQuestionOwner(params.questionId);
    const body = await request.json();
    const data = updateQuestionSchema.parse(body);

    const question = await prisma.question.update({
      where: { id: params.questionId },
      data: {
        ...data,
        options: data.options ? (data.options as any) : undefined,
      },
    });
    return NextResponse.json({ question });
  } catch (err: any) {
    return handleError(err);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    await verifyQuestionOwner(params.questionId);
    await prisma.question.delete({ where: { id: params.questionId } });
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
