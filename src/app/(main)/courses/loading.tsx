import { CourseGridSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function CoursesLoading() {
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="mb-10">
          <Skeleton className="h-10 w-64 mb-3" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-full rounded-full mb-8" />
        <CourseGridSkeleton count={8} />
      </div>
    </div>
  );
}
