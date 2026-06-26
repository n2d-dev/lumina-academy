import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-neutral-200', className)} />
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="block">
      <Skeleton className="w-full aspect-[16/10] rounded-xl sm:rounded-2xl mb-2 sm:mb-4" />
      <Skeleton className="h-3 sm:h-4 w-full mb-1 sm:mb-2" />
      <Skeleton className="h-3 sm:h-4 w-2/3 mb-1 sm:mb-2" />
      <Skeleton className="h-3 w-1/2 mb-1 sm:mb-3" />
      <Skeleton className="h-4 sm:h-5 w-1/3" />
    </div>
  );
}

export function CourseGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}
