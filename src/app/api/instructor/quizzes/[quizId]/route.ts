import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireInstructor } from '@/lib/auth-helpers';
import { updateQuizSchema } from '@/lib/validations/quiz';

interface Params {
  params: { quizId: string };
}

async function verifyQuizOwner(quizId: string) {
  const user = await requireInstructor();
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      lesson: {
        include: {
          section: { include: { course: { select: { instructorId: true, id: true } } } },
        },
      },
    },
  });
  if (!quiz) throw new Error('NOT_FOUND');
  if (user.role !== 'ADMIN' && quiz.lesson.section.course.instructorId !== user.id) {
    throw new Error('FORBIDDEN');
  }
  return { user, quiz };
}

export async function GET(_: Request, { params }: Params) {
  try {
    await verifyQuizOwner(params.quizId);

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.quizId },
      include: {
        questions: { orderBy: { order: 'asc' } },
        _count: { select: { attempts: true } },
      },
    });

    return NextResponse.json({ quiz });
  } catch (err: any) {
    return handleError(err);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await verifyQuizOwner(params.quizId);
    const body = await request.json();
    const data = updateQuizSchema.parse(body);

    const quiz = await prisma.quiz.update({
      where: { id: params.quizId },
      data,
    });
    return NextResponse.json({ quiz });
  } catch (err: any) {
    return handleError(err);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    await verifyQuizOwner(params.quizId);
    await prisma.quiz.delete({ where: { id: params.quizId } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return handleError(err);
  }
}

function handleError(err: any) {
  if (err instanceof z.ZodError) {
    return NextResponse.json({ message: err.errors[0].message }, { status: 400 });
  }
  if (err.message === 'NOT_FOUND') {
    return NextResponse.json({ message: 'Quiz không tồn tại' }, { status: 404 });
  }
  if (err.message === 'FORBIDDEN') {
    return NextResponse.json({ message: 'Không có quyền' }, { status: 403 });
  }
  return NextResponse.json({ message: err.message }, { status: 500 });
}
