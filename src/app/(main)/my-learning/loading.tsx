import { CourseGridSkeleton } from '@/components/ui/Skeleton';

export default function MyLearningLoading() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="h-10 w-48 bg-neutral-200 animate-pulse rounded-xl mb-8" />
        <CourseGridSkeleton count={4} />
      </div>
    </div>
  );
}
