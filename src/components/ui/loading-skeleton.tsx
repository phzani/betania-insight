import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  type: 'player-stats' | 'fixtures' | 'cards';
  count?: number;
}

export function LoadingSkeleton({ type, count = 5 }: LoadingSkeletonProps) {
  if (type === 'player-stats') {
    return (
      <div className="space-y-2 pr-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white/[0.02] p-2 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-2 w-8" />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <Skeleton className="h-2 w-16" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-2 w-12" />
                <Skeleton className="h-3 w-3 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'fixtures') {
    return (
      <div className="space-y-3 pr-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white/[0.02] p-3 rounded">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-8" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-6 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}