import { VideoPlayerSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function LearnLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Khu vực video */}
      <div className="flex-1">
        <VideoPlayerSkeleton />
      </div>
      {/* Sidebar danh sách bài học */}
      <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-border p-4 space-y-3">
        <Skeleton className="h-5 w-1/2 mb-4" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </aside>
    </div>
  );
}
