import { Skeleton } from '@/components/ui/Skeleton';

export function BoardCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Thumbnail */}
      <Skeleton className="aspect-video w-full" />

      {/* Info */}
      <div className="p-3 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
