import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireCourseOwner } from '@/lib/auth-helpers';
import { BasicInfoEditor } from './BasicInfoEditor';

export default async function EditPage({ params }: { params: { courseId: string } }) {
  try {
    await requireCourseOwner(params.courseId);
  } catch {
    notFound();
  }

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
  });

  if (!course) notFound();

  return <BasicInfoEditor course={course as any} />;
}
