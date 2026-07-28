import {
  PageHeaderSkeleton,
  FilterBarSkeleton,
  TableSkeleton,
} from "@/components/skeletons";

export default function CoachesLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <FilterBarSkeleton />
      <TableSkeleton rows={10} />
    </div>
  );
}
