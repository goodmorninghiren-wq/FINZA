"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { ExpenseSlice } from "./DashboardReportsProvider";

export function ExpensePieChart({ data }: { data: ExpenseSlice[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number | string | undefined) =>
            `₹${Number(value || 0).toLocaleString("en-IN")}`
          }
          contentStyle={{
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(16px)",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
            color: "hsl(var(--foreground))",
          }}
        />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          wrapperStyle={{ fontSize: "12px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
