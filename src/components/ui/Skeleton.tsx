import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-muted', className)} />
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

/** Skeleton cho hàng thống kê (dashboard) */
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 sm:p-6 bg-muted/40 rounded-2xl">
          <Skeleton className="w-12 h-12 rounded-xl mb-3" />
          <Skeleton className="h-7 w-1/2 mb-2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton cho dashboard giảng viên: stats + chart + bảng */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <StatsSkeleton />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border p-6">
          <Skeleton className="h-4 w-1/3 mb-6" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="rounded-2xl border border-border p-6">
          <Skeleton className="h-4 w-1/3 mb-6" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
      <div className="rounded-2xl border border-border p-6 space-y-4">
        <Skeleton className="h-4 w-1/4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

/** Skeleton cho khu vực video player (immersive learn page) */
export function VideoPlayerSkeleton() {
  return (
    <div className="w-full">
      <Skeleton className="w-full aspect-video rounded-none" />
      <div className="p-4 sm:p-6 space-y-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}
