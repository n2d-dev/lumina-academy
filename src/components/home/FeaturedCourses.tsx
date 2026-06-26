import { CourseGrid } from '@/components/course/CourseGrid';
import type { Course } from '@/types';

interface FeaturedCoursesProps {
  courses: Course[];
}

export function FeaturedCourses({ courses }: FeaturedCoursesProps) {
  return (
    <section className="py-12 sm:py-20 bg-neutral-50">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-6 sm:mb-12">
          <p className="text-sm font-bold text-yellow-600 mb-2 tracking-wider">XU HƯỚNG</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-display">
            Khóa học nổi bật
          </h2>
        </div>

        <CourseGrid courses={courses} />
      </div>
    </section>
  );
}
