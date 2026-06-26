import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import { submitAttemptSchema } from '@/lib/validations/quiz';
import { gradeAttempt } from '@/lib/grading';
import type { Question, AnswerMap } from '@/types/quiz';

interface Params {
  params: { quizId: string };
}

/**
 * POST /api/quiz/[quizId]/submit
 * Student submit câu trả lời để được chấm điểm
 *
 * Workflow:
 * 1. Verify user đã enroll vào course
 * 2. Verify chưa vượt maxAttempts
 * 3. Run grading engine
 * 4. Lưu attempt vào DB
 * 5. Return kết quả
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { answers } = submitAttemptSchema.parse(body);

    // 1. Fetch quiz với questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.quizId },
      include: {
        questions: { orderBy: { order: 'asc' } },
        lesson: {
          include: {
            section: { select: { courseId: true } },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ message: 'Quiz không tồn tại' }, { status: 404 });
    }

    if (quiz.questions.length === 0) {
      return NextResponse.json(
        { message: 'Quiz chưa có câu hỏi nào' },
        { status: 400 }
      );
    }

    // 2. Verify enrollment
    const courseId = quiz.lesson.section.courseId;
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    });

    if (!enrollment) {
      return NextResponse.json(
        { message: 'Bạn cần đăng ký khóa học để làm quiz' },
        { status: 403 }
      );
    }

    // 3. Check max attempts
    if (quiz.maxAttempts > 0) {
      const previousAttempts = await prisma.quizAttempt.count({
        where: { userId: user.id, quizId: params.quizId, status: 'GRADED' },
      });

      if (previousAttempts >= quiz.maxAttempts) {
        return NextResponse.json(
          { message: `Bạn đã hết số lần làm bài (${quiz.maxAttempts} lần)` },
          { status: 400 }
        );
      }
    }

    // 4. Grade
    const questionsForGrading: Question[] = quiz.questions.map((q) => ({
      id: q.id,
      type: q.type as Question['type'],
      text: q.text,
      explanation: q.explanation,
      points: q.points,
      order: q.order,
      options: q.options as unknown as Question['options'],
    }));

    const result = gradeAttempt(
      questionsForGrading,
      answers as AnswerMap,
      quiz.passingScore
    );

    // 5. Lưu attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        quizId: params.quizId,
        status: 'GRADED',
        answers: answers as any,
        score: result.score,
        earnedPoints: result.earnedPoints,
        totalPoints: result.totalPoints,
        passed: result.passed,
        submittedAt: new Date(),
      },
    });

    // Return kết quả với details (nếu showCorrectAnswers)
    return NextResponse.json({
      attempt: {
        id: attempt.id,
        score: result.score,
        earnedPoints: result.earnedPoints,
        totalPoints: result.totalPoints,
        passed: result.passed,
      },
      details: quiz.showCorrectAnswers ? result.details : null,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.errors[0].message }, { status: 400 });
    }
    console.error('Submit error:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
