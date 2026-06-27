"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { DivisionBreakdown } from "@/lib/types/dashboard";

const SERIES = [
  { key: "sent", name: "Sent", color: "var(--brand)" },
  { key: "opened", name: "Opened", color: "#f59e0b" },
  { key: "replied", name: "Replied", color: "#22c55e" },
] as const;

export function DivisionBreakdownChart({ data }: { data: DivisionBreakdown[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="division"
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
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            background: "var(--glass-bg-strong)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-md)",
            backdropFilter: "blur(12px)",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
        {SERIES.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={36} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
