"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp } from "lucide-react";
import { useDashboardReports } from "./DashboardReportsProvider";

const KPI_META = [
  {
    title: "Total Bank Balance",
    icon: Wallet,
    description: "Across all connected banks",
    pick: (d: ReturnType<typeof useDashboardReports>) => ({
      value: d.totalBankBalance,
      trend: "Live Data",
      trendUp: true,
    }),
  },
  {
    title: "Cash Inflow",
    icon: ArrowDownRight,
    description: "Revenue & Collections",
    pick: (d: ReturnType<typeof useDashboardReports>) => ({
      value: d.totalIncome,
      trend: "This Month",
      trendUp: true,
    }),
  },
  {
    title: "Cash Outflow",
    icon: ArrowUpRight,
    description: "Expenses & Payments",
    pick: (d: ReturnType<typeof useDashboardReports>) => ({
      value: d.totalExpenses,
      trend: "This Month",
      trendUp: true,
    }),
  },
  {
    title: "Net Cash Position",
    icon: TrendingUp,
    description: "Surplus for the period",
    pick: (d: ReturnType<typeof useDashboardReports>) => {
      const net = d.totalIncome - d.totalExpenses;
      return {
        value: net,
        trend: net >= 0 ? "Surplus" : "Deficit",
        trendUp: net >= 0,
      };
    },
  },
] as const;

const gradients = [
  "from-blue-500 to-purple-600",
  "from-green-500 to-emerald-600",
  "from-orange-500 to-red-600",
  "from-purple-500 to-pink-600",
];

export function KPICards() {
  const reports = useDashboardReports();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {KPI_META.map((item, index) => {
        const { value, trend, trendUp } = item.pick(reports);
        return (
          <Card
            key={item.title}
            className="glass border-white/10 hover-lift transition-smooth overflow-hidden relative group stagger-item"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${gradients[index]} opacity-0 group-hover:opacity-10 transition-smooth`}
            />
            <div
              className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${gradients[index]}`}
            />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
              <div
                className={`p-2 rounded-lg bg-gradient-to-br ${gradients[index]} opacity-80 group-hover:opacity-100 transition-smooth`}
              >
                <item.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-1">
                {reports.loading ? (
                  <span className="animate-pulse text-muted-foreground text-2xl">
                    Loading...
                  </span>
                ) : (
                  formatCurrency(value)
                )}
              </div>
              <p
                className={`text-xs font-medium flex items-center mt-1 ${trendUp ? "text-green-400" : "text-red-400"}`}
              >
                {trend}
              </p>
              <p className="text-xs text-muted-foreground mt-2">{item.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
