import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard, GlassCardContent, GlassCardHeader } from "@/components/glass-card";

/** Page h1 + subtitle placeholder — matches every page's header block. */
export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}

/** Row of dashboard-style stat cards. */
export function StatRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <GlassCard key={i} className="p-0">
          <GlassCardContent className="flex items-center justify-between gap-4 px-5 py-5">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-20" />
            </div>
            <Skeleton className="size-10 rounded-xl" />
          </GlassCardContent>
        </GlassCard>
      ))}
    </div>
  );
}

/** Large chart/content card with a title bar. */
export function ChartCardSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <GlassCard>
      <GlassCardHeader>
        <Skeleton className="h-5 w-48" />
      </GlassCardHeader>
      <GlassCardContent>
        <Skeleton className={`w-full ${height}`} />
      </GlassCardContent>
    </GlassCard>
  );
}

/** Filter/search control bar. */
export function FilterBarSkeleton() {
  return (
    <div className="flex flex-wrap gap-3">
      <Skeleton className="h-9 w-56 rounded-full" />
      <Skeleton className="h-9 w-32 rounded-full" />
      <Skeleton className="h-9 w-32 rounded-full" />
      <Skeleton className="h-9 w-24 rounded-full" />
    </div>
  );
}

/** Table with header + rows. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <GlassCard>
      <GlassCardContent className="flex flex-col gap-4 py-5">
        <div className="flex gap-6">
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="ml-auto h-4 w-24" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-6">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="ml-auto h-5 w-24 rounded-full" />
          </div>
        ))}
      </GlassCardContent>
    </GlassCard>
  );
}

/** Grid of media-style cards (schools). */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <GlassCard key={i}>
          <GlassCardContent className="flex flex-col gap-3 py-5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </GlassCardContent>
        </GlassCard>
      ))}
    </div>
  );
}

/** Stacked settings-style section cards. */
export function SectionCardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <GlassCard>
      <GlassCardHeader>
        <Skeleton className="h-5 w-36" />
      </GlassCardHeader>
      <GlassCardContent className="flex flex-col gap-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${85 - i * 15}%` }} />
        ))}
      </GlassCardContent>
    </GlassCard>
  );
}
