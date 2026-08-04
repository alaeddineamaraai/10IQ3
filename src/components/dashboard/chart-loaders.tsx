"use client";

import dynamic from "next/dynamic";

const Skeleton = () => <div className="h-[240px] animate-pulse rounded-lg bg-muted/30" />;

export const OutreachActivityChartLoader = dynamic(
  () => import("./outreach-activity-chart").then((m) => ({ default: m.OutreachActivityChart })),
  { ssr: false, loading: Skeleton }
);

export const DivisionBreakdownChartLoader = dynamic(
  () => import("./division-breakdown-chart").then((m) => ({ default: m.DivisionBreakdownChart })),
  { ssr: false, loading: Skeleton }
);

export const RegionChartLoader = dynamic(
  () => import("./region-chart").then((m) => ({ default: m.RegionChart })),
  { ssr: false, loading: Skeleton }
);
