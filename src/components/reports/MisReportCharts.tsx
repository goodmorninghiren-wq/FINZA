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
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#a78bfa",
  "#f472b6",
];

type ChartPoint = { name: string; amount: number };
type ExpensePoint = { name: string; value: number };

export function MisReportCharts({
  chartData,
  topExpenses,
  currency = "",
}: {
  chartData: ChartPoint[];
  topExpenses: ExpensePoint[];
  currency?: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="h-[350px] bg-transparent p-2" id="mis-chart-income-vs-expenses">
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
              }}
              formatter={(value: number | string | undefined) => [
                `${currency} ${Number(value || 0).toLocaleString()}`,
                "Amount",
              ]}
            />
            <Legend />
            <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.name === "Income"
                      ? "#22c55e"
                      : entry.name === "Net Profit"
                        ? "#3b82f6"
                        : "#ef4444"
                  }
                />
              ))}
              <LabelList
                dataKey="amount"
                position="top"
                formatter={(value) =>
                  `${currency} ${Number(value ?? 0).toLocaleString()}`
                }
                style={{ fill: "#fff", fontWeight: "bold", fontSize: "12px" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-[350px] bg-transparent p-2" id="mis-chart-expense-breakdown">
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <PieChart>
            <Pie
              data={topExpenses}
              cx="50%"
              cy="50%"
              labelLine={{ stroke: "#888", strokeWidth: 1 }}
              label={({ name, percent, value }) => {
                const percentage = ((percent || 0) * 100).toFixed(1);
                const amount = Number(value).toLocaleString();
                return `${name}: ${percentage}% (${currency} ${amount})`;
              }}
              outerRadius={90}
              fill="#8884d8"
              dataKey="value"
              stroke="none"
            >
              {topExpenses.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number | string | undefined) => [
                `${currency} ${Number(value || 0).toLocaleString()}`,
                "Amount",
              ]}
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
              }}
            />
            <Legend
              formatter={(value, entry: { payload?: { value?: number } }) => {
                const total = topExpenses.reduce((sum, item) => sum + item.value, 0);
                const pct =
                  total > 0 && entry.payload?.value
                    ? ((entry.payload.value / total) * 100).toFixed(1)
                    : "0";
                return `${value} (${pct}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
