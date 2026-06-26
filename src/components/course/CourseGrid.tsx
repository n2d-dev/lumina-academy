import { CourseCard } from './CourseCard';
import type { Course } from '@/types';

interface CourseGridProps {
  courses: Course[];
  emptyMessage?: string;
}

export function CourseGrid({ courses, emptyMessage = 'Không có khóa học nào' }: CourseGridProps) {
  if (courses.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-neutral-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
