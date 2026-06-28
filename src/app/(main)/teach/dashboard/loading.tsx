import { DashboardSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <Skeleton className="h-9 w-72 mb-8" />
        <DashboardSkeleton />
      </div>
    </div>
  );
}
