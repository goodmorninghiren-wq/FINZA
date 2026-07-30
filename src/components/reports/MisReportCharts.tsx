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
  Income:      "#1A6B3F", // Deep professional green
  Expenses:    "#8B1A1A", // Deep professional red
  "Net Profit":"#1E3A5F", // Dark navy blue
};

const PIE_COLORS = [
  "#1E3A5F", // Navy
  "#2E86AB", // Teal-blue
  "#A0522D", // Sienna
  "#1A6B3F", // Green
  "#6B46A0", // Purple
  "#B5451B", // Brick red
  "#2D7D9A", // Steel blue
];

type ChartPoint = { name: string; amount: number };
type ExpensePoint = { name: string; value: number };

const EnterpriseTooltipStyle = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #DDE3ED",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
  padding: "10px 14px",
  fontSize: "13px",
  color: "#111827",
};

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
      style={{ fontSize: "11px", fontWeight: 600, fill: "#374151" }}
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
          <div className="w-1 h-5 rounded-full" style={{ background: "#2E86AB" }} />
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1E3A5F" }}>
            Financial Performance
          </h3>
        </div>
        <div
          className="h-[300px] rounded-lg p-3"
          id="mis-chart-income-vs-expenses"
          style={{ background: "#F8FAFC", border: "1px solid #DDE3ED" }}
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
                stroke="#E5E7EB"
              />
              <XAxis
                dataKey="name"
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
                tick={{ fill: "#374151", fontWeight: 500 }}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxis}
                tick={{ fill: "#6B7280" }}
              />
              <Tooltip
                cursor={{ fill: "rgba(30,58,95,0.06)" }}
                contentStyle={EnterpriseTooltipStyle}
                formatter={(value: number | string | undefined) => [
                  `${currency} ${Number(value ?? 0).toLocaleString()}`,
                  "Amount",
                ]}
                labelStyle={{ fontWeight: 700, color: "#1E3A5F", marginBottom: 4 }}
              />
              <Bar
                dataKey="amount"
                radius={[5, 5, 0, 0]}
                label={(props: any) => (
                  <CustomBarLabel {...props} currency={currency} />
                )}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={BAR_COLORS[entry.name] ?? "#2E86AB"}
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
                style={{ backgroundColor: BAR_COLORS[entry.name] ?? "#2E86AB" }}
              />
              <span style={{ fontSize: "12px", color: "#374151", fontWeight: 500 }}>
                {entry.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pie Chart: Expense Breakdown */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ background: "#2E86AB" }} />
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1E3A5F" }}>
            Expense Breakdown (Top 5)
          </h3>
        </div>
        <div
          className="h-[300px] rounded-lg p-3"
          id="mis-chart-expense-breakdown"
          style={{ background: "#F8FAFC", border: "1px solid #DDE3ED" }}
        >
          {topExpenses.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p style={{ color: "#9CA3AF", fontSize: "13px" }}>
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
                  paddingAngle={2}
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
                  contentStyle={EnterpriseTooltipStyle}
                  labelStyle={{ fontWeight: 700, color: "#1E3A5F" }}
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
                      <span style={{ fontSize: "11px", color: "#374151" }}>
                        {value}{" "}
                        <span style={{ color: "#6B7280" }}>({pct}%)</span>
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
