import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiUser , authErrorResponse } from '@/lib/auth-helpers';

interface Params {
  params: { quizId: string };
}

/**
 * GET /api/quiz/[quizId]/attempts
 * Lấy lịch sử attempts của user cho quiz này
 */
export async function GET(_: Request, { params }: Params) {
  try {
    const user = await requireApiUser();

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId: user.id,
        quizId: params.quizId,
      },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        score: true,
        earnedPoints: true,
        totalPoints: true,
        passed: true,
        submittedAt: true,
        startedAt: true,
      },
    });

    const bestScore = attempts.reduce(
      (max, a) => (a.score && a.score > max ? a.score : max),
      0
    );

    return NextResponse.json({
      attempts,
      bestScore,
      totalAttempts: attempts.length,
    });
  } catch (err: any) {
    const authRes = authErrorResponse(err);
    if (authRes) return authRes;
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
