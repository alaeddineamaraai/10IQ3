import { Skeleton } from "@/components/ui/skeleton";
import {
  StatRowSkeleton,
  ChartCardSkeleton,
  TableSkeleton,
} from "@/components/skeletons";

export default function SchoolDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <StatRowSkeleton count={4} />
      <ChartCardSkeleton height="h-48" />
      <TableSkeleton rows={6} />
    </div>
  );
}
