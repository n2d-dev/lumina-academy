import { StatsSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function MyLearningLoading() {
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="mb-12">
          <StatsSkeleton />
        </div>
        <Skeleton className="h-7 w-40 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 sm:h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
