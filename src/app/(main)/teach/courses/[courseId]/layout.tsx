import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireCourseOwner } from '@/lib/auth-helpers';
import { CourseBuilderNav } from '@/components/instructor/CourseBuilderNav';

interface Props {
  children: React.ReactNode;
  params: { courseId: string };
}

/**
 * Layout cho course editor
 * - Verify ownership ngay layout (DRY)
 * - Sidebar nav cho 5 bước
 * - Tính toán completedSteps để highlight
 */
export default async function CourseEditorLayout({ children, params }: Props) {
  try {
    await requireCourseOwner(params.courseId);
  } catch {
    notFound();
  }

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      _count: { select: { sections: true } },
    },
  });

  if (!course) notFound();

  // Tính các step đã hoàn thành để highlight
  const completedSteps: string[] = [];
  if (course.description.length >= 50 && course.whatYouLearn.length >= 3) {
    completedSteps.push('edit');
  }
  if (course._count.sections > 0) {
    completedSteps.push('curriculum');
  }
  if (course.price > 0) {
    completedSteps.push('pricing');
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <CourseBuilderNav courseId={params.courseId} completedSteps={completedSteps} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
