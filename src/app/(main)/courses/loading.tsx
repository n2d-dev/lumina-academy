import { CourseGridSkeleton } from '@/components/ui/Skeleton';

export default function CoursesLoading() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="mb-10">
          <div className="h-10 w-64 bg-neutral-200 animate-pulse rounded-xl mb-3" />
          <div className="h-4 w-48 bg-neutral-100 animate-pulse rounded-lg" />
        </div>
        <div className="h-10 w-full bg-neutral-100 animate-pulse rounded-full mb-8" />
        <CourseGridSkeleton count={8} />
      </div>
    </div>
  );
}
