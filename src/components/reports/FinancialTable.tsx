"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FinancialRow {
    type: string;
    group?: string;
    Header?: any;
    Summary?: any;
    ColData?: any[];
    Rows?: { Row: any[] };
}

interface FinancialTableProps {
    data: any;
    currency: string;
    totalIncome: number;
}

// Enterprise design tokens
const NAVY = "#1E3A5F";
const ACCENT_BLUE = "#2E86AB";
const ROW_ALT = "#F8FAFC";
const ROW_SECTION_L0 = "#EEF4FB";
const ROW_TOTAL = "#E8F0F9";
const BORDER_COLOR = "#DDE3ED";
const TEXT_MAIN = "#111827";
const TEXT_MUTED = "#6B7280";
const TEXT_POSITIVE = "#15803D";
const TEXT_NEGATIVE = "#991B1B";

export function FinancialTable({ data, currency, totalIncome }: FinancialTableProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    const toggleSection = (key: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedSections(newExpanded);
    };

    const formatCurrency = (value: number) => {
        return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const calculatePercentage = (value: number) => {
        if (totalIncome === 0) return "0.0";
        return ((value / totalIncome) * 100).toFixed(1);
    };

    const renderRow = (row: FinancialRow, level: number = 0, parentKey: string = "", rowIndex: number = 0) => {
        const key = `${parentKey}-${row.group || row.type}-${level}`;
        const isExpanded = expandedSections.has(key);
        const hasChildren = row.Rows?.Row && row.Rows.Row.length > 0;

        if (row.type === "Section") {
            const headerText = row.Header?.ColData?.[0]?.value || row.group || "";
            const summaryValue = parseFloat(row.Summary?.ColData?.[1]?.value || "0");
            const percentage = calculatePercentage(summaryValue);
            const isPositive = summaryValue >= 0;

            return (
                <div key={key}>
                    {/* Section Header Row */}
                    <div
                        className={`flex items-center justify-between cursor-pointer group transition-colors duration-150 border-b border-border ${
                            level === 0 
                                ? "bg-muted/60 dark:bg-muted/30 border-l-4 border-l-primary" 
                                : "hover:bg-accent/40 border-l-4 border-l-transparent"
                        }`}
                        style={{
                            paddingLeft: `${level * 20 + 16}px`,
                            paddingRight: "16px",
                            paddingTop: level === 0 ? "12px" : "9px",
                            paddingBottom: level === 0 ? "12px" : "9px",
                        }}
                        onClick={() => hasChildren && toggleSection(key)}
                    >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {hasChildren ? (
                                <span className="text-primary shrink-0">
                                    {isExpanded
                                        ? <ChevronDown className="h-4 w-4" />
                                        : <ChevronRight className="h-4 w-4" />
                                    }
                                </span>
                            ) : (
                                <span className="w-4 flex-shrink-0" />
                            )}
                            <span
                                className={`truncate text-foreground ${
                                    level === 0 ? "text-sm font-bold uppercase tracking-wider" : "text-xs font-semibold"
                                }`}
                            >
                                {headerText}
                            </span>
                        </div>

                        <div className="flex items-center gap-6 flex-shrink-0">
                            <span
                                className={`font-mono text-right min-w-[140px] ${
                                    level === 0 ? "text-sm font-bold" : "text-xs font-semibold"
                                } ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                            >
                                {formatCurrency(summaryValue)}
                            </span>
                            <span className="font-mono text-right text-xs text-muted-foreground min-w-[60px]">
                                {percentage}%
                            </span>
                        </div>
                    </div>

                    {/* Children */}
                    {hasChildren && isExpanded && row.Rows?.Row && (
                        <div>
                            {row.Rows.Row.map((subRow: any, idx: number) =>
                                renderRow(subRow, level + 1, key + idx, idx)
                            )}
                        </div>
                    )}
                </div>
            );
        } else if (row.type === "Data" && row.ColData) {
            const label = row.ColData[0]?.value || "";
            const value = parseFloat(row.ColData[row.ColData.length - 1]?.value || "0");
            const percentage = calculatePercentage(value);
            const isEven = rowIndex % 2 === 0;

            return (
                <div
                    key={key}
                    className={`flex items-center justify-between transition-colors duration-100 border-b border-border border-l-4 border-l-transparent hover:bg-accent/40 ${
                        isEven ? "bg-card" : "bg-muted/20"
                    }`}
                    style={{
                        paddingLeft: `${level * 20 + 16}px`,
                        paddingRight: "16px",
                        paddingTop: "8px",
                        paddingBottom: "8px",
                    }}
                >
                    <span className="truncate text-xs text-foreground pl-5">
                        {label}
                    </span>
                    <div className="flex items-center gap-6 flex-shrink-0">
                        <span className={`font-mono text-right text-xs min-w-[140px] ${
                            value < 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                        }`}>
                            {formatCurrency(value)}
                        </span>
                        <span className="font-mono text-right text-xs text-muted-foreground min-w-[60px]">
                            {percentage}%
                        </span>
                    </div>
                </div>
            );
        }

        return null;
    };

    if (!data?.Rows?.Row) {
        return (
            <Card className="border border-border shadow-sm">
                <CardContent className="p-10 text-center">
                    <p className="text-muted-foreground text-sm">
                        No detailed financial data available. Select a date range and click Refresh.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border border-border shadow-sm overflow-hidden bg-card">
            {/* Card Header */}
            <CardHeader className="pb-0 border-b border-border">
                <div className="flex items-center justify-between pb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1 h-5 rounded-full bg-primary" />
                            <CardTitle className="text-base font-bold text-foreground">
                                Detailed Financial Breakdown
                            </CardTitle>
                        </div>
                        <p className="text-xs text-muted-foreground pl-3">
                            Click on section rows to expand / collapse line items
                        </p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-md bg-muted text-muted-foreground border border-border">
                        Profit & Loss
                    </span>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {/* Table Column Headers */}
                <div className="flex items-center justify-between bg-primary text-primary-foreground px-4 py-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                        Particulars
                    </span>
                    <div className="flex items-center gap-6">
                        <span className="text-[11px] font-bold uppercase tracking-wider min-w-[140px] text-right">
                            Amount
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider min-w-[60px] text-right">
                            % of Income
                        </span>
                    </div>
                </div>

                {/* Table Body */}
                <div className="overflow-y-auto max-h-[620px]">
                    {data.Rows.Row.map((row: any, idx: number) => renderRow(row, 0, `root-${idx}`, idx))}
                </div>

                {/* Table Footer */}
                <div className="flex items-center justify-end px-4 py-3 border-t border-border bg-muted/30">
                    <span className="text-xs text-muted-foreground">
                        All amounts in {currency} · Figures sourced from QuickBooks Online
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
