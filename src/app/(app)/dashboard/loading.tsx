import {
  PageHeaderSkeleton,
  StatRowSkeleton,
  ChartCardSkeleton,
} from "@/components/skeletons";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <StatRowSkeleton count={4} />
      <ChartCardSkeleton height="h-64" />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCardSkeleton height="h-48" />
        <ChartCardSkeleton height="h-48" />
      </div>
    </div>
  );
}
