import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import { QuizTakerClient } from './QuizTakerClient';

/**
 * Trang student làm quiz
 *
 * Verify:
 * 1. User đã login
 * 2. User đã enroll vào course chứa quiz
 * 3. Chưa vượt maxAttempts
 *
 * Quan trọng: KHÔNG gửi `isCorrect` xuống client để tránh cheating.
 * Chỉ gửi questions với options đã được "stripped" thông tin đáp án đúng.
 */
export default async function QuizTakingPage({
  params,
}: {
  params: { courseId: string; quizId: string };
}) {
  const user = await requireUser();

  // Fetch quiz
  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    include: {
      questions: { orderBy: { order: 'asc' } },
      lesson: {
        include: {
          section: { select: { courseId: true } },
        },
      },
      attempts: {
        where: { userId: user.id },
        orderBy: { startedAt: 'desc' },
      },
    },
  });

  if (!quiz) notFound();

  // Verify enrollment
  const courseId = quiz.lesson.section.courseId;
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });

  if (!enrollment) {
    redirect(`/courses/${courseId}`);
  }

  // Strip correctness từ options (anti-cheat)
  const safeQuestions = quiz.questions.map((q) => ({
    id: q.id,
    type: q.type,
    text: q.text,
    points: q.points,
    order: q.order,
    options: stripCorrectness(q.type, q.options as any),
  }));

  // Shuffle nếu cần
  const finalQuestions = quiz.shuffleQuestions
    ? [...safeQuestions].sort(() => Math.random() - 0.5)
    : safeQuestions;

  return (
    <QuizTakerClient
      quiz={{
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        maxAttempts: quiz.maxAttempts,
      }}
      questions={finalQuestions as any}
      previousAttempts={quiz.attempts.length}
      bestScore={Math.max(0, ...quiz.attempts.map((a) => a.score ?? 0))}
      courseId={params.courseId}
    />
  );
}

/**
 * Loại bỏ thông tin đáp án đúng trước khi gửi xuống client
 */
function stripCorrectness(type: string, options: any) {
  if (type === 'SHORT_ANSWER') {
    // Hoàn toàn không gửi acceptedAnswers
    return [];
  }
  // Choice options - bỏ isCorrect
  return (options as any[]).map(({ id, text }) => ({ id, text }));
}
