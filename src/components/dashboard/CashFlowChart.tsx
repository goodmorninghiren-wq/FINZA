"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardReports } from "./DashboardReportsProvider";

const CashFlowBarChart = dynamic(
  () => import("./CashFlowBarChart").then((m) => m.CashFlowBarChart),
  {
    ssr: false,
    loading: () => (
      <div className="text-muted-foreground animate-pulse">Loading chart...</div>
    ),
  }
);

export function CashFlowChart() {
  const { loading, error, monthlyCashFlow } = useDashboardReports();

  return (
    <Card className="glass border-white/10 hover-lift transition-smooth">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          Cash Flow Trends
        </CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full flex items-center justify-center">
          {loading ? (
            <div className="text-muted-foreground animate-pulse">Loading Chart Data...</div>
          ) : error ? (
            <div className="text-yellow-500 text-sm text-center px-4">{error}</div>
          ) : monthlyCashFlow.length === 0 ? (
            <div className="text-muted-foreground text-sm">No data available</div>
          ) : (
            <CashFlowBarChart data={monthlyCashFlow} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
