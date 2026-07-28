import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard, GlassCardContent } from "@/components/glass-card";
import { PageHeaderSkeleton } from "@/components/skeletons";

export default function AdvisorLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <GlassCard>
        <GlassCardContent className="flex min-h-[420px] flex-col gap-4 py-6">
          {/* Chat bubbles */}
          <div className="flex justify-start">
            <Skeleton className="h-16 w-2/3 rounded-2xl" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-1/2 rounded-2xl" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-20 w-3/4 rounded-2xl" />
          </div>
          {/* Input bar */}
          <div className="mt-auto flex gap-3">
            <Skeleton className="h-10 flex-1 rounded-full" />
            <Skeleton className="size-10 rounded-full" />
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
