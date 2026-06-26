import { notFound } from 'next/navigation';
import { getCourseBySlug } from '@/data/courses';
import { CourseDetailView } from './CourseDetailView';

/**
 * Trang chi tiết khóa học
 * Dynamic route /courses/[slug]
 */
export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  // Production: const course = await prisma.course.findUnique({ where: { slug: params.slug } });
  const course = getCourseBySlug(params.slug);

  if (!course) {
    notFound();
  }

  return <CourseDetailView course={course} />;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const course = getCourseBySlug(params.slug);
  return {
    title: course?.title ?? 'Khóa học',
    description: course?.description,
  };
}
