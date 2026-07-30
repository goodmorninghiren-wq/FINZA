"use client";

import { useEffect, useState } from "react";
import { Building2, Calendar, Clock, Shield } from "lucide-react";

interface ReportHeaderProps {
    dateRange: { start: string; end: string };
}

export function ReportHeader({ dateRange }: ReportHeaderProps) {
    const [companyName, setCompanyName] = useState<string>("Loading...");
    const [generatedTime] = useState(new Date().toLocaleString());

    useEffect(() => {
        // Fetch company info
        fetch("/api/qbo/company-info")
            .then((res) => res.json())
            .then((data) => {
                const name = data.CompanyInfo?.CompanyName || data.companyName || "Company";
                setCompanyName(name);
            })
            .catch(() => setCompanyName("Company"));
    }, []);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <div className="rounded-xl overflow-hidden border border-border bg-card shadow-sm mb-2">
            {/* Top navy accent bar */}
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #1E3A5F 0%, #2E86AB 50%, #1E3A5F 100%)" }} />

            <div className="px-8 py-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                    {/* Left: Company identity */}
                    <div className="flex items-start gap-4">
                        {/* Company icon block */}
                        <div
                            className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-xl"
                            style={{ background: "#1E3A5F" }}
                        >
                            <Building2 className="h-7 w-7 text-white" />
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1E3A5F" }}>
                                    {companyName}
                                </h1>
                                {/* Confidential badge */}
                                <span
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-widest border"
                                    style={{
                                        color: "#6B7280",
                                        borderColor: "#D1D5DB",
                                        backgroundColor: "#F9FAFB",
                                    }}
                                >
                                    <Shield className="h-3 w-3" />
                                    Confidential
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span
                                    className="inline-block px-3 py-1 rounded-md text-sm font-semibold text-white"
                                    style={{ background: "#2E86AB" }}
                                >
                                    Management Information System Report
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Metadata */}
                    <div
                        className="flex flex-col gap-3 md:items-end text-sm"
                        style={{ color: "#374151" }}
                    >
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 flex-shrink-0" style={{ color: "#2E86AB" }} />
                            <div className="text-right">
                                <span className="text-xs uppercase tracking-widest font-medium" style={{ color: "#9CA3AF" }}>
                                    Reporting Period
                                </span>
                                <p className="font-semibold" style={{ color: "#111827" }}>
                                    {formatDate(dateRange.start)}
                                    {dateRange.start && dateRange.end && (
                                        <span style={{ color: "#6B7280" }}> — </span>
                                    )}
                                    {formatDate(dateRange.end)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 flex-shrink-0" style={{ color: "#2E86AB" }} />
                            <div className="text-right">
                                <span className="text-xs uppercase tracking-widest font-medium" style={{ color: "#9CA3AF" }}>
                                    Generated On
                                </span>
                                <p className="font-semibold" style={{ color: "#111827" }}>
                                    {generatedTime}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom divider with metadata strip */}
                <div
                    className="mt-5 pt-4 flex items-center justify-between flex-wrap gap-2"
                    style={{ borderTop: "1px solid #E5E7EB" }}
                >
                    <div className="flex items-center gap-6 text-xs" style={{ color: "#6B7280" }}>
                        <span>
                            <span className="font-semibold uppercase tracking-wider">Report Type:</span>{" "}
                            Profit & Loss Analysis
                        </span>
                        <span>
                            <span className="font-semibold uppercase tracking-wider">Prepared By:</span>{" "}
                            RISE360 Automation Reporting Engine
                        </span>
                    </div>
                    <div
                        className="text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "#1E3A5F" }}
                    >
                        RISE360 · ENTERPRISE REPORTS
                    </div>
                </div>
            </div>
        </div>
    );
}
