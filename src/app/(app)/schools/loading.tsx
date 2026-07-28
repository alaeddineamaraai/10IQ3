import {
  PageHeaderSkeleton,
  FilterBarSkeleton,
  CardGridSkeleton,
} from "@/components/skeletons";

export default function SchoolsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <FilterBarSkeleton />
      <CardGridSkeleton count={9} />
    </div>
  );
}
