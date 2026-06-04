"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useStore } from "@/store/useStore";

export type MonthlyCashFlowPoint = {
  name: string;
  fullLabel: string;
  inflow: number;
  outflow: number;
};

export type ExpenseSlice = { name: string; value: number; color: string };

type DashboardReportsState = {
  loading: boolean;
  error: string | null;
  totalBankBalance: number;
  totalIncome: number;
  totalExpenses: number;
  monthlyCashFlow: MonthlyCashFlowPoint[];
  expenseSlices: ExpenseSlice[];
  refetch: () => void;
};

const EXPENSE_COLORS = [
  "#3b82f6",
  "#a855f7",
  "#f97316",
  "#eab308",
  "#06b6d4",
  "#ec4899",
  "#10b981",
  "#f59e0b",
];

const DashboardReportsContext = createContext<DashboardReportsState | null>(null);

function findSection(rows: any[], sectionName: string): any {
  for (const row of rows) {
    if (row.Header?.ColData?.[0]?.value === sectionName) return row;
    if (row.Rows?.Row) {
      const found = findSection(row.Rows.Row, sectionName);
      if (found) return found;
    }
  }
  return null;
}

function parseTotalsFromPl(report: any) {
  let totalIncome = 0;
  let totalExpenses = 0;
  const rows = report?.Rows?.Row || [];
  rows.forEach((row: any) => {
    if (row.group === "Income" || row.Header?.ColData?.[0]?.value === "Total Income") {
      const summary = row.Summary?.ColData?.[1]?.value;
      if (summary) totalIncome = parseFloat(summary) || 0;
    }
    if (row.group === "Expenses" || row.Header?.ColData?.[0]?.value === "Total Expenses") {
      const summary = row.Summary?.ColData?.[1]?.value;
      if (summary) totalExpenses = Math.abs(parseFloat(summary) || 0);
    }
  });
  return { totalIncome, totalExpenses };
}

function parseMonthlyCashFlow(report: any): MonthlyCashFlowPoint[] {
  if (!report?.Columns?.Column || !report?.Rows?.Row) return [];

  const columns = report.Columns.Column;
  const timeColumns: { index: number; label: string }[] = [];
  columns.forEach((col: any, index: number) => {
    if (col.ColType === "Money" && col.ColTitle && col.ColTitle !== "Total") {
      timeColumns.push({ index, label: col.ColTitle });
    }
  });

  const monthlyData = timeColumns.map((col) => ({
    name: col.label.split(" ")[0],
    fullLabel: col.label,
    inflow: 0,
    outflow: 0,
  }));

  const incomeSection = findSection(report.Rows.Row, "Income");
  const expenseSection = findSection(report.Rows.Row, "Expenses");
  const incomeRow = incomeSection?.Summary;
  const expenseRow = expenseSection?.Summary;

  monthlyData.forEach((item, i) => {
    const colIndex = timeColumns[i].index;
    if (incomeRow?.ColData?.[colIndex]) {
      item.inflow = parseFloat(incomeRow.ColData[colIndex].value) || 0;
    }
    if (expenseRow?.ColData?.[colIndex]) {
      item.outflow = Math.abs(parseFloat(expenseRow.ColData[colIndex].value) || 0);
    }
  });

  return monthlyData;
}

function parseExpenseSlices(report: any): ExpenseSlice[] {
  const expenseSection = findSection(report?.Rows?.Row || [], "Expenses");
  if (!expenseSection?.Rows?.Row) return [];

  const expenseItems: ExpenseSlice[] = [];
  expenseSection.Rows.Row.forEach((row: any, index: number) => {
    if (row.ColData?.[0] && row.ColData?.[1]) {
      const name = row.ColData[0].value;
      const value = Math.abs(parseFloat(row.ColData[1].value) || 0);
      if (name && !name.toLowerCase().includes("total") && value > 0) {
        expenseItems.push({
          name,
          value,
          color: EXPENSE_COLORS[index % EXPENSE_COLORS.length],
        });
      }
    }
  });

  return expenseItems.sort((a, b) => b.value - a.value).slice(0, 8);
}

function getDateRanges() {
  const today = new Date();
  const annualStart = new Date(today);
  annualStart.setFullYear(today.getFullYear() - 1);

  const monthlyStart = new Date(today);
  monthlyStart.setMonth(today.getMonth() - 11);
  monthlyStart.setDate(1);

  const endDate = today.toISOString().split("T")[0];
  return {
    annualStart: annualStart.toISOString().split("T")[0],
    monthlyStart: monthlyStart.toISOString().split("T")[0],
    endDate,
  };
}

export function DashboardReportsProvider({ children }: { children: ReactNode }) {
  const { selectedCompany } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalBankBalance, setTotalBankBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [monthlyCashFlow, setMonthlyCashFlow] = useState<MonthlyCashFlowPoint[]>([]);
  const [expenseSlices, setExpenseSlices] = useState<ExpenseSlice[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { annualStart, monthlyStart, endDate } = getDateRanges();
      const companyQuery = selectedCompany?.id
        ? `&companyId=${encodeURIComponent(selectedCompany.id)}`
        : "";

      const [bankRes, annualPlRes, monthlyPlRes] = await Promise.all([
        fetch(`/api/qbo/accounts?type=Bank${companyQuery}`),
        fetch(
          `/api/qbo/reports/profit-and-loss?start_date=${annualStart}&end_date=${endDate}${companyQuery}`
        ),
        fetch(
          `/api/qbo/reports/profit-and-loss?start_date=${monthlyStart}&end_date=${endDate}&summarize_column_by=Month${companyQuery}`
        ),
      ]);

      if (bankRes.ok) {
        const bankData = await bankRes.json();
        const accounts = Array.isArray(bankData)
          ? bankData
          : bankData.QueryResponse?.Account || [];
        const balance = accounts.reduce(
          (sum: number, acc: { CurrentBalance?: string }) =>
            sum + (parseFloat(acc.CurrentBalance || "0") || 0),
          0
        );
        setTotalBankBalance(balance);
      }

      if (annualPlRes.ok) {
        const annualReport = await annualPlRes.json();
        const { totalIncome: income, totalExpenses: expenses } =
          parseTotalsFromPl(annualReport);
        setTotalIncome(income);
        setTotalExpenses(expenses);
        setExpenseSlices(parseExpenseSlices(annualReport));
      } else if (annualPlRes.status === 503) {
        setError("QuickBooks is temporarily unavailable. Please try again shortly.");
      }

      if (monthlyPlRes.ok) {
        const monthlyReport = await monthlyPlRes.json();
        setMonthlyCashFlow(parseMonthlyCashFlow(monthlyReport));
      }
    } catch (e) {
      console.error("Dashboard reports load failed", e);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [selectedCompany?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(
    () => ({
      loading,
      error,
      totalBankBalance,
      totalIncome,
      totalExpenses,
      monthlyCashFlow,
      expenseSlices,
      refetch: load,
    }),
    [
      loading,
      error,
      totalBankBalance,
      totalIncome,
      totalExpenses,
      monthlyCashFlow,
      expenseSlices,
      load,
    ]
  );

  return (
    <DashboardReportsContext.Provider value={value}>
      {children}
    </DashboardReportsContext.Provider>
  );
}

export function useDashboardReports(): DashboardReportsState {
  const ctx = useContext(DashboardReportsContext);
  if (!ctx) {
    throw new Error("useDashboardReports must be used within DashboardReportsProvider");
  }
  return ctx;
}
