import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireCourseOwner } from '@/lib/auth-helpers';
import { PublishView } from './PublishView';

export default async function PublishPage({
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
      sections: { include: { lessons: true } },
    },
  });
  if (!course) notFound();

  // Tính các check trước khi publish
  const checks = [
    {
      label: 'Tiêu đề ít nhất 10 ký tự',
      passed: course.title.length >= 10,
    },
    {
      label: 'Mô tả ít nhất 50 ký tự',
      passed: course.description.length >= 50,
    },
    {
      label: 'Có ít nhất 3 mục "Bạn sẽ học được"',
      passed: course.whatYouLearn.length >= 3,
    },
    {
      label: 'Có ít nhất 1 chương',
      passed: course.sections.length > 0,
    },
    {
      label: 'Có ít nhất 1 bài học',
      passed: course.sections.some((s) => s.lessons.length > 0),
    },
    {
      label: 'Đã có ít nhất 1 bài học có video',
      passed: course.sections.some((s) =>
        s.lessons.some((l) => l.videoUrl)
      ),
    },
    {
      label: 'Đã đặt giá khóa học',
      passed: course.price >= 0,
    },
  ];

  return (
    <PublishView
      course={{
        id: course.id,
        title: course.title,
        slug: course.slug,
        status: course.status,
      }}
      checks={checks}
    />
  );
}
