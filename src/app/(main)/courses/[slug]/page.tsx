import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCourseBySlug } from '@/data/courses';
import { SITE_CONFIG } from '@/lib/constants';
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

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const course = getCourseBySlug(params.slug);

  if (!course) {
    return { title: 'Không tìm thấy khóa học' };
  }

  const description = course.subtitle ?? course.description;
  const ogImage = course.thumbnail ?? SITE_CONFIG.ogImage;
  const canonical = `/courses/${params.slug}`;

  return {
    title: course.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title: course.title,
      description,
      url: canonical,
      images: [{ url: ogImage, width: 1200, height: 630, alt: course.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: course.title,
      description,
      images: [ogImage],
    },
  };
}
