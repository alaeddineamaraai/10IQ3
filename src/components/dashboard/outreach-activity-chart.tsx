"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ActivityPoint } from "@/lib/types/dashboard";

export function OutreachActivityChart({ data }: { data: ActivityPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
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
          labelFormatter={(label) => `${label}`}
          formatter={(value) => [value, "Sent"]}
        />
        <Line
          type="monotone"
          dataKey="sent"
          stroke="var(--brand)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--brand)", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
