import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireInstructor } from '@/lib/auth-helpers';
import { DashboardClient } from './DashboardClient';

/**
 * Trang dashboard instructor
 * Hiển thị stats + danh sách courses của instructor
 */
export default async function TeachDashboardPage() {
  const user = await requireInstructor();

  // Fetch tất cả course của instructor + aggregate stats
  const [courses, totalEnrollments, totalRevenue] = await Promise.all([
    prisma.course.findMany({
      where: { instructorId: user.id },
      include: {
        category: true,
        _count: { select: { enrollments: true, sections: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.enrollment.count({
      where: { course: { instructorId: user.id } },
    }),
    prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        // Lưu ý: aggregate này chỉ chính xác nếu mỗi payment chỉ chứa 1 course
        // Production cần lưu CoursePayment riêng để track đúng instructor share
      },
      _sum: { amount: true },
    }),
  ]);

  return (
    <DashboardClient
      courses={courses as any}
      totalEnrollments={totalEnrollments}
      totalRevenue={totalRevenue._sum.amount ?? 0}
    />
  );
}
