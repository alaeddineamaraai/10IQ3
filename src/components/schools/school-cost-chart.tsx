"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CostData = {
  tuition_in_state: number | null;
  tuition_out_of_state: number | null;
  room_and_board: number | null;
};

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function SchoolCostChart({ data }: { data: CostData }) {
  const chartData = [
    {
      name: "In-state",
      Tuition: data.tuition_in_state ?? 0,
      "Room & Board": data.room_and_board ?? 0,
    },
    {
      name: "Out-of-state",
      Tuition: data.tuition_out_of_state ?? 0,
      "Room & Board": data.room_and_board ?? 0,
    },
  ];

  if (!data.tuition_in_state && !data.tuition_out_of_state) return null;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          width={38}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            fontSize: 12,
          }}
          formatter={(value: number) => [fmt.format(value)]}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)", paddingTop: 4 }}
        />
        <Bar dataKey="Tuition" stackId="a" fill="var(--brand)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Room & Board" stackId="a" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} opacity={0.5} />
      </BarChart>
    </ResponsiveContainer>
  );
}
