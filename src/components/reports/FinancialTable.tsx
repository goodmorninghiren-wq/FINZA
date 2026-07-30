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
                        className="flex items-center justify-between cursor-pointer group transition-colors duration-150"
                        style={{
                            paddingLeft: `${level * 20 + 16}px`,
                            paddingRight: "16px",
                            paddingTop: level === 0 ? "12px" : "9px",
                            paddingBottom: level === 0 ? "12px" : "9px",
                            backgroundColor: level === 0 ? ROW_SECTION_L0 : "transparent",
                            borderLeft: level === 0 ? `4px solid ${ACCENT_BLUE}` : `4px solid transparent`,
                            borderBottom: `1px solid ${BORDER_COLOR}`,
                        }}
                        onClick={() => hasChildren && toggleSection(key)}
                    >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {hasChildren ? (
                                <span style={{ color: ACCENT_BLUE, flexShrink: 0 }}>
                                    {isExpanded
                                        ? <ChevronDown className="h-4 w-4" />
                                        : <ChevronRight className="h-4 w-4" />
                                    }
                                </span>
                            ) : (
                                <span className="w-4 flex-shrink-0" />
                            )}
                            <span
                                className="truncate"
                                style={{
                                    fontSize: level === 0 ? "14px" : "13px",
                                    fontWeight: level === 0 ? 700 : 600,
                                    color: level === 0 ? NAVY : TEXT_MAIN,
                                    letterSpacing: level === 0 ? "0.01em" : "0",
                                    textTransform: level === 0 ? "uppercase" : "none",
                                }}
                            >
                                {headerText}
                            </span>
                        </div>

                        <div className="flex items-center gap-6 flex-shrink-0">
                            <span
                                className="font-mono text-right"
                                style={{
                                    fontSize: level === 0 ? "14px" : "13px",
                                    fontWeight: level === 0 ? 700 : 600,
                                    color: isPositive ? TEXT_POSITIVE : TEXT_NEGATIVE,
                                    minWidth: "140px",
                                }}
                            >
                                {formatCurrency(summaryValue)}
                            </span>
                            <span
                                className="font-mono text-right"
                                style={{
                                    fontSize: "12px",
                                    fontWeight: level === 0 ? 600 : 400,
                                    color: TEXT_MUTED,
                                    minWidth: "60px",
                                }}
                            >
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
                    className="flex items-center justify-between transition-colors duration-100"
                    style={{
                        paddingLeft: `${level * 20 + 16}px`,
                        paddingRight: "16px",
                        paddingTop: "8px",
                        paddingBottom: "8px",
                        backgroundColor: isEven ? "#FFFFFF" : ROW_ALT,
                        borderBottom: `1px solid ${BORDER_COLOR}`,
                        borderLeft: "4px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = "#F0F6FF";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = isEven ? "#FFFFFF" : ROW_ALT;
                    }}
                >
                    <span
                        className="truncate"
                        style={{ fontSize: "13px", color: TEXT_MAIN, paddingLeft: "20px" }}
                    >
                        {label}
                    </span>
                    <div className="flex items-center gap-6 flex-shrink-0">
                        <span
                            className="font-mono text-right"
                            style={{
                                fontSize: "13px",
                                color: value < 0 ? TEXT_NEGATIVE : TEXT_MAIN,
                                minWidth: "140px",
                            }}
                        >
                            {formatCurrency(value)}
                        </span>
                        <span
                            className="font-mono text-right"
                            style={{ fontSize: "12px", color: TEXT_MUTED, minWidth: "60px" }}
                        >
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
            <Card className="border shadow-sm" style={{ borderColor: BORDER_COLOR }}>
                <CardContent className="p-10 text-center">
                    <p style={{ color: TEXT_MUTED, fontSize: "14px" }}>
                        No detailed financial data available. Select a date range and click Refresh.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border shadow-sm overflow-hidden" style={{ borderColor: BORDER_COLOR }}>
            {/* Card Header */}
            <CardHeader className="pb-0" style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}>
                <div className="flex items-center justify-between pb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div
                                className="w-1 h-5 rounded-full"
                                style={{ background: ACCENT_BLUE }}
                            />
                            <CardTitle style={{ fontSize: "16px", fontWeight: 700, color: NAVY }}>
                                Detailed Financial Breakdown
                            </CardTitle>
                        </div>
                        <p style={{ fontSize: "13px", color: TEXT_MUTED, paddingLeft: "12px" }}>
                            Click on section rows to expand / collapse line items
                        </p>
                    </div>
                    <span
                        className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-md"
                        style={{ color: NAVY, background: ROW_SECTION_L0, border: `1px solid ${BORDER_COLOR}` }}
                    >
                        Profit & Loss
                    </span>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {/* Table Column Headers */}
                <div
                    className="flex items-center justify-between"
                    style={{
                        backgroundColor: NAVY,
                        paddingLeft: "16px",
                        paddingRight: "16px",
                        paddingTop: "10px",
                        paddingBottom: "10px",
                    }}
                >
                    <span
                        style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#FFFFFF",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                        }}
                    >
                        Particulars
                    </span>
                    <div className="flex items-center gap-6">
                        <span
                            style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#FFFFFF",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                minWidth: "140px",
                                textAlign: "right",
                            }}
                        >
                            Amount
                        </span>
                        <span
                            style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#FFFFFF",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                minWidth: "60px",
                                textAlign: "right",
                            }}
                        >
                            % of Income
                        </span>
                    </div>
                </div>

                {/* Table Body */}
                <div className="overflow-y-auto" style={{ maxHeight: "620px" }}>
                    {data.Rows.Row.map((row: any, idx: number) => renderRow(row, 0, `root-${idx}`, idx))}
                </div>

                {/* Table Footer */}
                <div
                    className="flex items-center justify-end px-4 py-3"
                    style={{
                        borderTop: `1px solid ${BORDER_COLOR}`,
                        backgroundColor: "#F9FAFB",
                    }}
                >
                    <span style={{ fontSize: "11px", color: TEXT_MUTED }}>
                        All amounts in {currency} · Figures sourced from QuickBooks Online
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
