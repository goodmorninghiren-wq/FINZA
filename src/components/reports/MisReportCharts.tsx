"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Enterprise professional color palette
const BAR_COLORS: Record<string, string> = {
  Income:      "#10B981", // Vibrant Emerald Green
  Expenses:    "#EF4444", // Vibrant Rose Red
  "Net Profit":"#3B82F6", // Vibrant Electric Blue
};

const PIE_COLORS = [
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
];

type ChartPoint = { name: string; amount: number };
type ExpensePoint = { name: string; value: number };

interface CustomBarLabelProps {
  x?: number;
  y?: number;
  width?: number;
  value?: number;
  currency?: string;
}

function CustomBarLabel({ x = 0, y = 0, width = 0, value = 0, currency = "" }: CustomBarLabelProps) {
  if (!value) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      textAnchor="middle"
      className="fill-foreground text-[11px] font-semibold"
    >
      {`${currency} ${Number(value).toLocaleString()}`}
    </text>
  );
}

export function MisReportCharts({
  chartData,
  topExpenses,
  currency = "",
}: {
  chartData: ChartPoint[];
  topExpenses: ExpensePoint[];
  currency?: string;
}) {
  const formatYAxis = (value: number) => {
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return `${value}`;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">

      {/* Bar Chart: Income vs Expenses vs Net Profit */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Financial Performance
          </h3>
        </div>
        <div
          className="h-[300px] rounded-xl p-3 bg-card border border-border shadow-sm"
          id="mis-chart-income-vs-expenses"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 28, right: 16, left: 0, bottom: 4 }}
              barCategoryGap="40%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                className="stroke-border/60"
              />
              <XAxis
                dataKey="name"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "currentColor", fontSize: 12, fontWeight: 500 }}
                className="text-muted-foreground"
              />
              <YAxis
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxis}
                tick={{ fill: "currentColor", fontSize: 11 }}
                className="text-muted-foreground"
              />
              <Tooltip
                cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "10px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  color: "hsl(var(--card-foreground))",
                  fontSize: "13px"
                }}
                formatter={(value: number | string | undefined) => [
                  `${currency} ${Number(value ?? 0).toLocaleString()}`,
                  "Amount",
                ]}
                labelStyle={{ fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: 4 }}
              />
              <Bar
                dataKey="amount"
                radius={[6, 6, 0, 0]}
                label={(props: any) => (
                  <CustomBarLabel {...props} currency={currency} />
                )}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={BAR_COLORS[entry.name] ?? "#3B82F6"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Legend */}
        <div className="flex items-center justify-center gap-5 mt-3">
          {chartData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: BAR_COLORS[entry.name] ?? "#3B82F6" }}
              />
              <span className="text-xs text-foreground font-medium">
                {entry.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pie Chart: Expense Breakdown */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Expense Breakdown (Top 5)
          </h3>
        </div>
        <div
          className="h-[300px] rounded-xl p-3 bg-card border border-border shadow-sm"
          id="mis-chart-expense-breakdown"
        >
          {topExpenses.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-xs">
                No expense data available
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topExpenses}
                  cx="50%"
                  cy="45%"
                  outerRadius={95}
                  innerRadius={40}
                  paddingAngle={3}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="none"
                >
                  {topExpenses.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | string | undefined) => [
                    `${currency} ${Number(value ?? 0).toLocaleString()}`,
                    "Amount",
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "10px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    color: "hsl(var(--card-foreground))",
                    fontSize: "13px"
                  }}
                  labelStyle={{ fontWeight: 700, color: "hsl(var(--foreground))" }}
                />
                <Legend
                  iconType="square"
                  iconSize={10}
                  formatter={(value, entry: any) => {
                    const total = topExpenses.reduce((sum, item) => sum + item.value, 0);
                    const pct =
                      total > 0 && entry.payload?.value
                        ? ((entry.payload.value / total) * 100).toFixed(1)
                        : "0";
                    return (
                      <span className="text-xs text-foreground font-medium">
                        {value}{" "}
                        <span className="text-muted-foreground">({pct}%)</span>
                      </span>
                    );
                  }}
                  wrapperStyle={{ paddingTop: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
