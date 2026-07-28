import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard, GlassCardContent, GlassCardHeader } from "@/components/glass-card";
import { PageHeaderSkeleton } from "@/components/skeletons";

export default function PaywallLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 pt-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <GlassCard key={i}>
            <GlassCardHeader>
              <Skeleton className="h-5 w-16" />
              <Skeleton className="mt-2 h-9 w-28" />
            </GlassCardHeader>
            <GlassCardContent className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-3.5 flex-1" />
                </div>
              ))}
              <Skeleton className="mt-4 h-9 w-full rounded-lg" />
            </GlassCardContent>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
