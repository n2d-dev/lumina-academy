import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MOCK_COURSES } from '@/data/courses';
import { LearnView } from './LearnView';

/**
 * Trang xem video học - Immersive layout
 * KHÔNG có header/footer (đã setup ở route group khác - không nằm trong (main))
 *
 * Production:
 *   1. Verify user đã enroll vào course
 *   2. Fetch course với sections, lessons
 *   3. Fetch progress của user
 */
export default async function LearnPage({ params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/login?callbackUrl=/learn/${params.courseId}`);
  }

  // TODO: Verify enrollment trong production
  // const enrollment = await prisma.enrollment.findUnique({
  //   where: { userId_courseId: { userId: session.user.id, courseId: params.courseId } }
  // });
  // if (!enrollment) redirect(`/courses/${params.courseId}`);

  const course = MOCK_COURSES.find((c) => c.id === params.courseId);
  if (!course) notFound();

  const completedLessonIds: string[] = ['l1', 'l2']; // Mock - lấy từ DB

  return <LearnView course={course} completedLessonIds={completedLessonIds} />;
}
