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

type ClimateData = {
  avg_temp_jan_f: number | null;
  avg_temp_july_f: number | null;
};

export function SchoolClimateChart({ data }: { data: ClimateData }) {
  if (data.avg_temp_jan_f == null && data.avg_temp_july_f == null) return null;

  const chartData = [
    { month: "Jan", temp: data.avg_temp_jan_f ?? 0 },
    { month: "Jul", temp: data.avg_temp_july_f ?? 0 },
  ];

  // Color-code by temperature: cold=blue, warm=orange, hot=red
  function tempColor(t: number) {
    if (t < 32) return "#6eb3f7";   // freezing — blue
    if (t < 55) return "#7dbaef";   // cold — light blue
    if (t < 75) return "#f9a03f";   // mild — orange
    return "#e05c3a";               // hot — red
  }

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={40}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickFormatter={(v) => `${v}°`}
          width={32}
          domain={[0, "auto"]}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            fontSize: 12,
          }}
          formatter={(value: number) => [`${value}°F`, "Avg temp"]}
        />
        <Bar dataKey="temp" radius={[6, 6, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.month} fill={tempColor(entry.temp)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
