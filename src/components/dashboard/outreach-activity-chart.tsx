"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";
import type { ActivityPoint } from "@/lib/types/dashboard";

const SERIES = [
  { key: "sent",    name: "Sent",    color: "var(--chart-1)" },
  { key: "opened",  name: "Opened",  color: "var(--chart-4)" },
  { key: "replied", name: "Replied", color: "var(--chart-2)" },
] as const;

type Filter = "all" | "sent" | "opened" | "replied";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sent", label: "Sent" },
  { value: "opened", label: "Opened" },
  { value: "replied", label: "Replied" },
];

export function OutreachActivityChart({ data }: { data: ActivityPoint[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = filter === "all" ? SERIES : SERIES.filter((s) => s.key === filter);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-smooth touch-manipulation select-none",
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted/40 text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            width={28}
          />
          <Tooltip
            contentStyle={{
              background: "var(--glass-bg-strong)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-md)",
              backdropFilter: "blur(12px)",
            }}
          />
          {filter === "all" && (
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
          )}
          {visible.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2.5}
              dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
