import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireInstructor } from '@/lib/auth-helpers';
import { QuizEditorClient } from './QuizEditorClient';

export default async function QuizEditorPage({
  params,
}: {
  params: { courseId: string; quizId: string };
}) {
  const user = await requireInstructor();

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    include: {
      questions: { orderBy: { order: 'asc' } },
      lesson: {
        include: {
          section: { include: { course: { select: { instructorId: true, id: true } } } },
        },
      },
    },
  });

  if (!quiz) notFound();

  // Verify ownership
  if (
    user.role !== 'ADMIN' &&
    quiz.lesson.section.course.instructorId !== user.id
  ) {
    notFound();
  }

  return (
    <QuizEditorClient
      quiz={quiz as any}
      courseId={params.courseId}
      lessonTitle={quiz.lesson.title}
    />
  );
}
