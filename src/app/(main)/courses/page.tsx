import { CoursesPageClient } from './CoursesPageClient';
import { MOCK_COURSES } from '@/data/courses';

/**
 * Trang danh sách khóa học
 * Server component fetch data, client component xử lý filter/search
 */
export default async function CoursesPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  // Production: fetch từ database với filter
  const courses = MOCK_COURSES;

  return (
    <CoursesPageClient
      initialCourses={courses}
      initialCategory={searchParams.category ?? 'all'}
      initialQuery={searchParams.q ?? ''}
    />
  );
}
