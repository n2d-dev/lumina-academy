import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireCourseOwner } from '@/lib/auth-helpers';
import { QuizListClient } from './QuizListClient';

/**
 * Trang quản lý quizzes của course
 * Hiển thị danh sách lessons với option tạo/xem quiz cho từng lesson
 */
export default async function QuizzesPage({
  params,
}: {
  params: { courseId: string };
}) {
  try {
    await requireCourseOwner(params.courseId);
  } catch {
    notFound();
  }

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      sections: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: {
              quiz: {
                include: {
                  _count: { select: { questions: true, attempts: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!course) notFound();

  return <QuizListClient course={course as any} />;
}
