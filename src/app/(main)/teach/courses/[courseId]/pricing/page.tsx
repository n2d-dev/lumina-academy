import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireCourseOwner } from '@/lib/auth-helpers';
import { PricingEditor } from './PricingEditor';

export default async function PricingPage({
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
    select: { id: true, price: true, originalPrice: true, title: true },
  });
  if (!course) notFound();

  return <PricingEditor course={course} />;
}
