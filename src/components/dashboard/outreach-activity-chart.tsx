"use client";

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

import type { ActivityPoint } from "@/lib/types/dashboard";

const SERIES = [
  { key: "sent", name: "Sent", color: "var(--brand)" },
  { key: "opened", name: "Opened", color: "#f59e0b" },
  { key: "replied", name: "Replied", color: "#22c55e" },
] as const;

export function OutreachActivityChart({ data }: { data: ActivityPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
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
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />
        {SERIES.map((s) => (
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
  );
}
