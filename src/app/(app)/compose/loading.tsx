import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard, GlassCardContent, GlassCardHeader } from "@/components/glass-card";
import { PageHeaderSkeleton } from "@/components/skeletons";

export default function ComposeLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Recipients list */}
        <GlassCard>
          <GlassCardHeader>
            <Skeleton className="h-5 w-28" />
          </GlassCardHeader>
          <GlassCardContent className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </GlassCardContent>
        </GlassCard>
        {/* Editor */}
        <GlassCard>
          <GlassCardHeader>
            <Skeleton className="h-5 w-40" />
          </GlassCardHeader>
          <GlassCardContent className="flex flex-col gap-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-64 w-full" />
            <div className="flex justify-end gap-3">
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
