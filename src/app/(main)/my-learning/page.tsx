import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MyLearningView } from './MyLearningView';
import { MOCK_COURSES } from '@/data/courses';

/**
 * Trang Học tập của tôi
 * Hiển thị các khóa học user đã enroll, kèm progress
 *
 * Production:
 *   const enrollments = await prisma.enrollment.findMany({
 *     where: { userId: session.user.id },
 *     include: { course: { include: { instructor: true, category: true } } }
 *   });
 */
export default async function MyLearningPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/my-learning');
  }

  // Mock: assume user enrolled vào course 1 và 3
  const enrolledCourses = MOCK_COURSES.filter((c) => ['1', '3'].includes(c.id));
  const progress: Record<string, number> = { '1': 35, '3': 12 };

  return <MyLearningView courses={enrolledCourses} progress={progress} />;
}
