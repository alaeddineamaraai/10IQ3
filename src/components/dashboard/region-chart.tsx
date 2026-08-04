"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { RegionBreakdown } from "@/lib/types/dashboard";

export function RegionChart({ data }: { data: RegionBreakdown[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No region data available.
      </div>
    );
  }

  const chartData = data.map((r) => ({
    region: r.region.replace("New England", "N. England"),
    total: r.total,
    sent: r.sent,
    pct: r.total > 0 ? Math.round((r.sent / r.total) * 100) : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="region"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          width={30}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            fontSize: 12,
          }}
          formatter={(value, name) => [
            value,
            name === "total" ? "Total schools" : "Contacted",
          ]}
        />
        <Bar dataKey="total" fill="var(--muted-foreground)" opacity={0.25} radius={[4, 4, 0, 0]} maxBarSize={32} />
        <Bar dataKey="sent" radius={[4, 4, 0, 0]} maxBarSize={32}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.pct >= 10 ? "var(--brand)" : entry.pct >= 3 ? "var(--chart-3)" : "var(--chart-4)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
