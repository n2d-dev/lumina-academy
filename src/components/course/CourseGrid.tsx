import { SearchX } from 'lucide-react';
import { CourseCard } from './CourseCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Course } from '@/types';

interface CourseGridProps {
  courses: Course[];
  emptyMessage?: string;
}

export function CourseGrid({ courses, emptyMessage = 'Không có khóa học nào' }: CourseGridProps) {
  if (courses.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={emptyMessage}
        description="Thử đổi bộ lọc hoặc từ khóa tìm kiếm khác."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:gap-x-8 lg:gap-y-12">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
