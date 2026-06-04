"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import type { MonthlyCashFlowPoint } from "./DashboardReportsProvider";

export function CashFlowBarChart({ data }: { data: MonthlyCashFlowPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${value / 1000}k`}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.05)" }}
          contentStyle={{
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(16px)",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
            color: "hsl(var(--foreground))",
          }}
          formatter={(value: number | string | undefined) => [
            `₹${Number(value || 0).toLocaleString("en-IN")}`,
            "",
          ]}
        />
        <Legend iconType="circle" wrapperStyle={{ paddingTop: "10px" }} />
        <Bar
          dataKey="inflow"
          name="Cash Inflow"
          fill="hsl(217, 91%, 60%)"
          radius={[6, 6, 0, 0]}
          barSize={30}
        />
        <Bar
          dataKey="outflow"
          name="Cash Outflow"
          fill="hsl(25, 95%, 53%)"
          radius={[6, 6, 0, 0]}
          barSize={30}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
