"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardReports } from "./DashboardReportsProvider";

const ExpensePieChart = dynamic(
  () => import("./ExpensePieChart").then((m) => m.ExpensePieChart),
  {
    ssr: false,
    loading: () => (
      <div className="text-muted-foreground animate-pulse">Loading chart...</div>
    ),
  }
);

export function ExpenseChart() {
  const { loading, error, expenseSlices } = useDashboardReports();

  return (
    <Card className="glass border-white/10 hover-lift transition-smooth">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          Expense Split
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full flex items-center justify-center">
          {loading ? (
            <div className="text-muted-foreground animate-pulse">Loading Chart Data...</div>
          ) : error ? (
            <div className="text-yellow-500 text-sm text-center px-4">{error}</div>
          ) : expenseSlices.length === 0 ? (
            <div className="text-muted-foreground text-sm">No expense data available</div>
          ) : (
            <ExpensePieChart data={expenseSlices} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
