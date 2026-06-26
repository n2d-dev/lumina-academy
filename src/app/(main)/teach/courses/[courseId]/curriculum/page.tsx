import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireCourseOwner } from '@/lib/auth-helpers';
import { CurriculumBuilder } from './CurriculumBuilder';

export default async function CurriculumPage({
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
          lessons: { orderBy: { order: 'asc' } },
        },
      },
    },
  });

  if (!course) notFound();

  return <CurriculumBuilder course={course as any} />;
}
