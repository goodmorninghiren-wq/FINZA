"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, RefreshCw, Mail, TrendingUp, TrendingDown, Minus, ArrowUpRight, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dynamic from "next/dynamic";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { FinancialTable } from "@/components/reports/FinancialTable";
import { useStore } from "@/store/useStore";

const MisReportCharts = dynamic(
  () => import("@/components/reports/MisReportCharts").then((m) => m.MisReportCharts),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[300px] flex items-center justify-center rounded-lg"
        style={{ background: "#F8FAFC", border: "1px solid #DDE3ED" }}
      >
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" style={{ color: "#2E86AB" }} />
          <p style={{ fontSize: "13px", color: "#6B7280" }}>Loading charts…</p>
        </div>
      </div>
    ),
  }
);

// ─── Design tokens ────────────────────────────────────────────────────────────
const NAVY       = "#1E3A5F";
const ACCENT     = "#2E86AB";
const BORDER     = "#DDE3ED";
const TEXT_MAIN  = "#111827";
const TEXT_MUTED = "#6B7280";
const BG_SOFT    = "#F8FAFC";

// ─── Section Divider ──────────────────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full" style={{ background: ACCENT }} />
        <span
          className="font-bold uppercase tracking-widest"
          style={{ fontSize: "11px", color: NAVY }}
        >
          {label}
        </span>
      </div>
      <div className="flex-1 h-px" style={{ background: BORDER }} />
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  currency,
  sub,
  accentColor,
  trend,
}: {
  label: string;
  value: number;
  currency: string;
  sub?: string;
  accentColor: string;
  trend?: "up" | "down" | "neutral";
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "#15803D" : trend === "down" ? "#991B1B" : TEXT_MUTED;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: `1px solid ${BORDER}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        borderTop: `3px solid ${accentColor}`,
      }}
    >
      <div className="px-5 py-4">
        <p
          className="uppercase tracking-widest font-semibold mb-3"
          style={{ fontSize: "10px", color: TEXT_MUTED }}
        >
          {label}
        </p>
        <p
          className="font-bold font-mono mb-1"
          style={{ fontSize: "22px", color: TEXT_MAIN, letterSpacing: "-0.5px" }}
        >
          {currency} {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        {sub && (
          <div className="flex items-center gap-1 mt-1">
            <TrendIcon className="h-3.5 w-3.5" style={{ color: trendColor }} />
            <p style={{ fontSize: "12px", color: trendColor, fontWeight: 500 }}>{sub}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default function MISReportsPage() {
    const [pnlData, setPnlData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [presetFilter, setPresetFilter] = useState<string>("last_month");
    const [companyName, setCompanyName] = useState<string>("Company");
    const [companyId, setCompanyId] = useState<string>("");

    const { selectedCompany } = useStore();

    // Email State
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [clientEmail, setClientEmail] = useState("");
    const [emailSubject, setEmailSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");
    const [sendingEmail, setSendingEmail] = useState(false);

    // Preset Date Calculation Helper
    const applyDatePreset = (preset: string) => {
        setPresetFilter(preset);
        if (preset === 'custom') return;

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        const formatDateStr = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        let start = '';
        let end = '';

        if (preset === "last_month") {
            const firstDay = new Date(year, month - 1, 1);
            const lastDay = new Date(year, month, 0);
            start = formatDateStr(firstDay);
            end = formatDateStr(lastDay);
        } else if (preset === "current_month") {
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            start = formatDateStr(firstDay);
            end = formatDateStr(lastDay);
        } else if (preset === "last_year") {
            const firstDay = new Date(year - 1, 0, 1);
            const lastDay = new Date(year - 1, 11, 31);
            start = formatDateStr(firstDay);
            end = formatDateStr(lastDay);
        } else if (preset === "current_year") {
            const firstDay = new Date(year, 0, 1);
            const lastDay = new Date(year, 11, 31);
            start = formatDateStr(firstDay);
            end = formatDateStr(lastDay);
        } else if (preset === "all") {
            start = '2000-01-01';
            end = formatDateStr(now);
        }

        if (start && end) {
            setDateRange({ start, end });
        }
    };

    // Initialize with Last Month
    useEffect(() => {
        applyDatePreset("last_month");

        // Fetch company info for PDF
        fetch("/api/qbo/company-info")
            .then((res) => res.json())
            .then((data) => {
                const name = data.CompanyInfo?.CompanyName || data.companyName || "Company";
                setCompanyName(name);
            })
            .catch(() => setCompanyName("Company"));
    }, []);

    // Fetch and sync client email
    useEffect(() => {
        if (selectedCompany?.id) {
            setCompanyId(selectedCompany.id);
            setCompanyName(selectedCompany.name);

            fetch('/api/qbo/companies')
                .then(res => res.json())
                .then(companies => {
                    const match = companies.find((c: any) => c.id === selectedCompany.id);
                    if (match) {
                        setClientEmail(match.client_email || "");
                    }
                })
                .catch(err => console.error("Failed to fetch client email:", err));
        }
    }, [selectedCompany]);

    const fetchReports = () => {
        if (!dateRange.start || !dateRange.end) return;

        setLoading(true);
        const query = `?start_date=${dateRange.start}&end_date=${dateRange.end}`;

        fetch(`/api/qbo/reports/profit-and-loss${query}`)
            .then(res => res.json())
            .then(data => {
                setPnlData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("MIS Fetch Error:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        if (dateRange.start && dateRange.end) {
            const handler = setTimeout(() => {
                fetchReports();
            }, 400);

            return () => {
                clearTimeout(handler);
            };
        }
    }, [dateRange]);

    // Extract key metrics from P&L
    // Note: This relies on standard QBO P&L structure (Income, Expenses, Net Income)
    const getMetric = (rows: any[], groupName: string): number => {
        if (!rows) return 0;
        // Search recursively or at top level
        for (const row of rows) {
            if (row.group === groupName) {
                return parseFloat(row.Summary.ColData[1].value); // Assuming col 1 is value
            }
            if (row.Rows?.Row) {
                const found: number = getMetric(row.Rows.Row, groupName);
                if (found) return found;
            }
        }
        return 0;
    };

    // Simplification: Iterate top level rows to find "Income" and "Expenses" sections
    // --- Metric Calculation ---
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalCOGS = 0;
    let netIncome = 0;
    const expenseBreakdown: { name: string, value: number }[] = [];

    if (pnlData?.Rows?.Row) {
        const rows = pnlData.Rows.Row;
        rows.forEach((row: any) => {
            const group = row.group;
            const value = parseFloat(row.Summary?.ColData?.[1]?.value || "0");

            if (group === "Income") {
                totalIncome = value;
            }
            else if (group === "Cost of Goods Sold" || group === "COGS") {
                totalCOGS = value;
            }
            else if (group === "Expenses") {
                totalExpenses = value;

                // Extract top-level specific expenses for Pie Chart
                if (row.Rows?.Row) {
                    row.Rows.Row.forEach((subRow: any) => {
                        const subValStr = subRow.type === 'Section'
                            ? subRow.Summary?.ColData?.[1]?.value
                            : subRow.ColData?.[1]?.value;

                        const subVal = parseFloat(subValStr || "0");
                        const subName = subRow.type === 'Section'
                            ? (subRow.Header?.ColData?.[0]?.value || subRow.group)
                            : subRow.ColData?.[0]?.value;

                        if (subVal > 0 && subName) {
                            expenseBreakdown.push({ name: subName, value: subVal });
                        }
                    });
                }
            }
        });

        // Final Net Income check
        const lastRow = rows[rows.length - 1];
        if (lastRow?.group === "Net Income") {
            netIncome = parseFloat(lastRow.Summary?.ColData?.[1]?.value || "0");
        } else {
            netIncome = totalIncome - totalExpenses - totalCOGS; // Fallback
        }
    }

    // Sort and limit expense breakdown for Chart
    const topExpenses = expenseBreakdown
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5

    // Ratios
    const grossProfit = totalIncome - totalCOGS;
    const grossMargin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;
    const netMargin = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;
    const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

    const chartData = [
        { name: "Income", amount: totalIncome },
        { name: "Expenses", amount: totalExpenses },
        { name: "Net Profit", amount: netIncome },
    ];

    const currency = pnlData?.Header?.Currency || "USD";

    // ─── PDF Export ──────────────────────────────────────────────────────────
    const handleExport = async (returnBlob = false) => {
        if (!pnlData || !pnlData.Rows) {
            alert("No data available to export.");
            return;
        }

        try {
            setExporting(true);
            const [{ default: jsPDF }, { default: autoTable }, { default: html2canvas }] =
                await Promise.all([
                    import("jspdf"),
                    import("jspdf-autotable"),
                    import("html2canvas"),
                ]);

            const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pageW = 210;
            const pageH = 297;
            const marginL = 14;
            const marginR = 14;
            const contentW = pageW - marginL - marginR;

            const currencySymbol = pnlData.Header?.Currency || "USD";
            const periodStr = pnlData.Header?.StartPeriod
                ? `${pnlData.Header.StartPeriod} to ${pnlData.Header.EndPeriod}`
                : `${dateRange.start} to ${dateRange.end}`;
            const generatedStr = new Date().toLocaleString();

            // ── Colour palette ──────────────────────────────────────────────
            const C_NAVY    = [30, 58, 95]    as [number, number, number];
            const C_BLUE    = [46, 134, 171]  as [number, number, number];
            const C_WHITE   = [255, 255, 255] as [number, number, number];
            const C_LGRAY   = [248, 250, 252] as [number, number, number];
            const C_DGRAY   = [107, 114, 128] as [number, number, number];
            const C_BORDER  = [221, 227, 237] as [number, number, number];
            const C_SECTION = [238, 244, 251] as [number, number, number];
            const C_TOTAL   = [232, 240, 249] as [number, number, number];
            const C_GREEN   = [21, 128, 61]   as [number, number, number];
            const C_RED     = [153, 27, 27]   as [number, number, number];
            const C_TEXT    = [17, 24, 39]    as [number, number, number];

            // ── Helper: draw page frame (header + footer) ───────────────────
            const drawPageFrame = (pageNum: number, totalPages: number) => {
                // ── Top gradient bar (thin) ──
                doc.setFillColor(...C_NAVY);
                doc.rect(0, 0, pageW, 6, "F");
                doc.setFillColor(...C_BLUE);
                doc.rect(pageW / 2, 0, pageW / 2, 6, "F");

                // ── Company stripe ──
                doc.setFillColor(...C_NAVY);
                doc.rect(0, 6, pageW, 20, "F");

                // Company name
                doc.setFont("helvetica", "bold");
                doc.setFontSize(13);
                doc.setTextColor(...C_WHITE);
                doc.text(companyName, marginL, 19);

                // Report title (right side)
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.setTextColor(180, 205, 235);
                doc.text("Management Information System Report", pageW - marginR, 19, { align: "right" });

                // ── Thin accent line below header ──
                doc.setFillColor(...C_BLUE);
                doc.rect(0, 26, pageW, 0.8, "F");

                // ── Footer ──
                doc.setFillColor(...C_LGRAY);
                doc.rect(0, pageH - 10, pageW, 10, "F");
                doc.setDrawColor(...C_BORDER);
                doc.line(0, pageH - 10, pageW, pageH - 10);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(7.5);
                doc.setTextColor(...C_DGRAY);
                doc.text(`RISE360 Automation · Enterprise Reports  ·  Generated: ${generatedStr}`, marginL, pageH - 4);
                doc.text(`Page ${pageNum} of ${totalPages}  ·  CONFIDENTIAL`, pageW - marginR, pageH - 4, { align: "right" });
            };

            // ────────────────────────────────────────────────────────────────
            // PAGE 1 — Executive Summary
            // ────────────────────────────────────────────────────────────────
            let currentY = 32;

            // ── Period badge ──────────────────────────────────────────────
            doc.setFillColor(...C_LGRAY);
            doc.roundedRect(marginL, currentY, contentW, 12, 2, 2, "F");
            doc.setDrawColor(...C_BORDER);
            doc.roundedRect(marginL, currentY, contentW, 12, 2, 2, "D");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(...C_NAVY);
            doc.text("REPORTING PERIOD", marginL + 4, currentY + 5);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(...C_TEXT);
            doc.text(periodStr, marginL + 4, currentY + 9.5);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(...C_NAVY);
            doc.text("REPORT TYPE", pageW / 2 + 4, currentY + 5);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(...C_TEXT);
            doc.text("Profit & Loss Analysis", pageW / 2 + 4, currentY + 9.5);

            currentY += 18;

            // ── Section: Executive Summary ────────────────────────────────
            doc.setFillColor(...C_NAVY);
            doc.rect(marginL, currentY, contentW, 7, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(...C_WHITE);
            doc.text("EXECUTIVE SUMMARY", marginL + 4, currentY + 4.8);
            currentY += 11;

            // KPI summary table
            const kpiData = [
                ["Total Revenue", `${currencySymbol} ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, ""],
                ["Cost of Goods Sold", `${currencySymbol} ${totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, ""],
                ["Gross Profit", `${currencySymbol} ${grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, `${grossMargin.toFixed(1)}%`],
                ["Total Expenses", `${currencySymbol} ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, `${expenseRatio.toFixed(1)}% of Revenue`],
                ["Net Income / (Loss)", `${currencySymbol} ${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, `${netMargin.toFixed(1)}% Net Margin`],
            ];

            autoTable(doc, {
                startY: currentY,
                head: [["Metric", "Amount", "Ratio / Margin"]],
                body: kpiData,
                theme: "plain",
                headStyles: {
                    fillColor: C_BLUE,
                    textColor: C_WHITE,
                    fontStyle: "bold",
                    fontSize: 9,
                    cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
                    halign: "left",
                },
                columnStyles: {
                    0: { cellWidth: 80, fontStyle: "bold", textColor: C_TEXT as any },
                    1: { cellWidth: 60, halign: "right", fontStyle: "bold", textColor: C_TEXT as any },
                    2: { cellWidth: 42, halign: "right", textColor: C_DGRAY as any },
                },
                styles: {
                    fontSize: 9,
                    cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
                    lineColor: C_BORDER as any,
                    lineWidth: 0.3,
                },
                alternateRowStyles: { fillColor: C_LGRAY as any },
                // Highlight Net Income row
                didParseCell: (hookData: any) => {
                    if (hookData.section === "body" && hookData.row.index === 4) {
                        hookData.cell.styles.fillColor = C_TOTAL;
                        hookData.cell.styles.fontStyle = "bold";
                        if (hookData.column.index === 1) {
                            hookData.cell.styles.textColor = netIncome >= 0 ? C_GREEN : C_RED;
                        }
                    }
                },
                margin: { left: marginL, right: marginR },
            });

            currentY = (doc as any).lastAutoTable.finalY + 10;

            // ── Section: Key Performance Indicators ───────────────────────
            doc.setFillColor(...C_NAVY);
            doc.rect(marginL, currentY, contentW, 7, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(...C_WHITE);
            doc.text("KEY PERFORMANCE INDICATORS", marginL + 4, currentY + 4.8);
            currentY += 11;

            // KPI cards: 3 per row
            const kpis = [
                { label: "Gross Margin", value: `${grossMargin.toFixed(2)}%`, positive: grossMargin >= 0 },
                { label: "Net Margin", value: `${netMargin.toFixed(2)}%`, positive: netMargin >= 0 },
                { label: "Expense Ratio", value: `${expenseRatio.toFixed(2)}%`, positive: true },
                { label: "Total Income", value: `${currencySymbol} ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, positive: true },
                { label: "Total Expenses", value: `${currencySymbol} ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, positive: false },
                { label: "Net Income", value: `${currencySymbol} ${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, positive: netIncome >= 0 },
            ];

            const kpiW = (contentW - 8) / 3;
            const kpiH = 20;
            kpis.forEach((kpi, i) => {
                const col = i % 3;
                const row = Math.floor(i / 3);
                const x = marginL + col * (kpiW + 4);
                const y = currentY + row * (kpiH + 4);

                // Card bg
                doc.setFillColor(...C_LGRAY);
                doc.roundedRect(x, y, kpiW, kpiH, 2, 2, "F");
                doc.setDrawColor(...C_BORDER);
                doc.roundedRect(x, y, kpiW, kpiH, 2, 2, "D");

                // Top accent bar
                doc.setFillColor(...(kpi.positive ? C_BLUE : C_RED));
                doc.roundedRect(x, y, kpiW, 1.5, 0.5, 0.5, "F");

                // Label
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7);
                doc.setTextColor(...C_DGRAY);
                doc.text(kpi.label.toUpperCase(), x + 4, y + 7);

                // Value
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.setTextColor(...(kpi.positive ? C_GREEN : C_RED));
                doc.text(kpi.value, x + 4, y + 15);
            });

            currentY += Math.ceil(kpis.length / 3) * (kpiH + 4) + 4;

            // Draw page 1 frame (placeholder — will be drawn at end)
            // ────────────────────────────────────────────────────────────────
            // PAGE 2 — Charts
            // ────────────────────────────────────────────────────────────────
            doc.addPage();
            let p2Y = 32;

            // ── Section: Financial Charts ──────────────────────────────────
            doc.setFillColor(...C_NAVY);
            doc.rect(marginL, p2Y, contentW, 7, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(...C_WHITE);
            doc.text("FINANCIAL CHARTS", marginL + 4, p2Y + 4.8);
            p2Y += 11;

            // Capture Bar Chart
            const barChartEl = document.getElementById("mis-chart-income-vs-expenses");
            if (barChartEl) {
                const canvas = await html2canvas(barChartEl, { scale: 2, backgroundColor: "#F8FAFC" });
                const imgData = canvas.toDataURL("image/jpeg", 0.92);
                const imgW = (contentW / 2) - 3;
                const imgH = (canvas.height * imgW) / canvas.width;

                // Sub-label
                doc.setFont("helvetica", "bold");
                doc.setFontSize(8);
                doc.setTextColor(...C_NAVY);
                doc.text("Financial Performance", marginL, p2Y + 4);
                doc.addImage(imgData, "JPEG", marginL, p2Y + 6, imgW, imgH);

                // Capture Pie Chart alongside
                const pieChartEl = document.getElementById("mis-chart-expense-breakdown");
                if (pieChartEl) {
                    const pieCanvas = await html2canvas(pieChartEl, { scale: 2, backgroundColor: "#F8FAFC" });
                    const pieImgData = pieCanvas.toDataURL("image/jpeg", 0.92);
                    const pieW = imgW;
                    const pieH = (pieCanvas.height * pieW) / pieCanvas.width;

                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(8);
                    doc.setTextColor(...C_NAVY);
                    doc.text("Expense Breakdown (Top 5)", marginL + imgW + 6, p2Y + 4);
                    doc.addImage(pieImgData, "JPEG", marginL + imgW + 6, p2Y + 6, pieW, pieH);

                    p2Y += Math.max(imgH, pieH) + 14;
                } else {
                    p2Y += imgH + 14;
                }
            }

            // ── Top Expenses table ────────────────────────────────────────
            if (topExpenses.length > 0) {
                doc.setFillColor(...C_NAVY);
                doc.rect(marginL, p2Y, contentW, 7, "F");
                doc.setFont("helvetica", "bold");
                doc.setFontSize(8.5);
                doc.setTextColor(...C_WHITE);
                doc.text("TOP EXPENSE CATEGORIES", marginL + 4, p2Y + 4.8);
                p2Y += 11;

                const totalExp = topExpenses.reduce((s, e) => s + e.value, 0);
                autoTable(doc, {
                    startY: p2Y,
                    head: [["Expense Category", "Amount", "% Share"]],
                    body: topExpenses.map(e => [
                        e.name,
                        `${currencySymbol} ${e.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                        `${totalExp > 0 ? ((e.value / totalExp) * 100).toFixed(1) : "0.0"}%`,
                    ]),
                    theme: "plain",
                    headStyles: {
                        fillColor: C_BLUE,
                        textColor: C_WHITE,
                        fontStyle: "bold",
                        fontSize: 9,
                        cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
                    },
                    columnStyles: {
                        0: { cellWidth: 110 },
                        1: { cellWidth: 50, halign: "right" },
                        2: { cellWidth: 22, halign: "right" },
                    },
                    styles: {
                        fontSize: 9,
                        cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 },
                        lineColor: C_BORDER as any,
                        lineWidth: 0.3,
                        textColor: C_TEXT as any,
                    },
                    alternateRowStyles: { fillColor: C_LGRAY as any },
                    margin: { left: marginL, right: marginR },
                });
            }

            // ────────────────────────────────────────────────────────────────
            // PAGE 3+ — Detailed Financial Breakdown
            // ────────────────────────────────────────────────────────────────
            doc.addPage();
            let p3Y = 32;

            doc.setFillColor(...C_NAVY);
            doc.rect(marginL, p3Y, contentW, 7, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(...C_WHITE);
            doc.text("DETAILED PROFIT & LOSS STATEMENT", marginL + 4, p3Y + 4.8);
            p3Y += 11;

            // Build flat table rows
            const tableRows: any[] = [];

            const processRow = (row: any, indentLevel: number) => {
                const pad = "  ".repeat(indentLevel);

                if (row.type === "Section") {
                    const headerVal = row.Header?.ColData?.[0]?.value || row.group;
                    if (headerVal) {
                        const sectionLabel = indentLevel === 0
                            ? headerVal.toUpperCase()
                            : headerVal;
                        tableRows.push([
                            {
                                content: pad + sectionLabel,
                                styles: {
                                    fontStyle: "bold",
                                    fillColor: indentLevel === 0 ? C_SECTION : [242, 246, 251],
                                    textColor: C_NAVY,
                                    fontSize: indentLevel === 0 ? 9.5 : 9,
                                },
                            },
                            { content: "", styles: { fillColor: indentLevel === 0 ? C_SECTION : [242, 246, 251] } },
                            { content: "", styles: { fillColor: indentLevel === 0 ? C_SECTION : [242, 246, 251] } },
                        ]);
                    }

                    if (row.Rows?.Row) {
                        row.Rows.Row.forEach((subRow: any) => processRow(subRow, indentLevel + 1));
                    }

                    if (row.Summary) {
                        const sumLabel = row.Summary.ColData?.[0]?.value || "";
                        const sumValStr = row.Summary.ColData?.[row.Summary.ColData.length - 1]?.value;
                        const sumVal = parseFloat(sumValStr || "0");
                        const percent = totalIncome === 0
                            ? "0.0%"
                            : ((sumVal / totalIncome) * 100).toFixed(1) + "%";
                        const isPositive = sumVal >= 0;

                        tableRows.push([
                            {
                                content: pad + "TOTAL " + sumLabel,
                                styles: {
                                    fontStyle: "bold",
                                    fillColor: C_TOTAL,
                                    textColor: C_NAVY,
                                    fontSize: 9,
                                },
                            },
                            {
                                content: `${currencySymbol} ${sumVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                                styles: {
                                    fontStyle: "bold",
                                    halign: "right",
                                    fillColor: C_TOTAL,
                                    textColor: isPositive ? C_GREEN : C_RED,
                                },
                            },
                            {
                                content: percent,
                                styles: {
                                    fontStyle: "bold",
                                    halign: "right",
                                    fillColor: C_TOTAL,
                                    textColor: C_DGRAY,
                                },
                            },
                        ]);
                    }
                } else if (row.type === "Data" && row.ColData) {
                    const label = row.ColData[0]?.value;
                    const valStr = row.ColData[row.ColData.length - 1]?.value;
                    const val = parseFloat(valStr || "0");
                    const percent =
                        totalIncome === 0
                            ? "0.0%"
                            : ((val / totalIncome) * 100).toFixed(1) + "%";

                    tableRows.push([
                        pad + (label || ""),
                        {
                            content: `${currencySymbol} ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                            styles: { halign: "right", textColor: val < 0 ? C_RED : C_TEXT },
                        },
                        {
                            content: percent,
                            styles: { halign: "right", textColor: C_DGRAY },
                        },
                    ]);
                }
            };

            if (pnlData.Rows?.Row) {
                pnlData.Rows.Row.forEach((row: any) => processRow(row, 0));
            }

            // Net Income summary row at the end
            tableRows.push([
                {
                    content: "NET INCOME / (LOSS)",
                    styles: {
                        fontStyle: "bold",
                        fillColor: C_NAVY,
                        textColor: C_WHITE,
                        fontSize: 10,
                    },
                },
                {
                    content: `${currencySymbol} ${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    styles: {
                        fontStyle: "bold",
                        halign: "right",
                        fillColor: C_NAVY,
                        textColor: C_WHITE,
                        fontSize: 10,
                    },
                },
                {
                    content: `${netMargin.toFixed(1)}%`,
                    styles: {
                        fontStyle: "bold",
                        halign: "right",
                        fillColor: C_NAVY,
                        textColor: C_WHITE,
                        fontSize: 10,
                    },
                },
            ]);

            autoTable(doc, {
                startY: p3Y,
                head: [["Particulars", "Amount", "% of Income"]],
                body: tableRows,
                theme: "plain",
                headStyles: {
                    fillColor: C_BLUE,
                    textColor: C_WHITE,
                    fontStyle: "bold",
                    fontSize: 9,
                    cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
                },
                columnStyles: {
                    0: { cellWidth: 110 },
                    1: { cellWidth: 50, halign: "right" },
                    2: { cellWidth: 22, halign: "right" },
                },
                styles: {
                    fontSize: 8.5,
                    cellPadding: { top: 3, bottom: 3, left: 5, right: 5 },
                    lineColor: C_BORDER as any,
                    lineWidth: 0.25,
                    textColor: C_TEXT as any,
                },
                alternateRowStyles: { fillColor: C_LGRAY as any },
                margin: { left: marginL, right: marginR },
                didDrawPage: () => {
                    // handled below in final loop
                },
            });

            // ── Draw frames on all pages ──────────────────────────────────
            const totalPages = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                drawPageFrame(i, totalPages);
            }

            if (returnBlob) {
                setExporting(false);
                return doc.output("blob");
            }

            // Save PDF
            const dateStr = new Date().toISOString().split("T")[0];
            const safeCompanyName = companyName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
            doc.save(`${safeCompanyName}_MIS_Report_${dateStr}.pdf`);

            setExporting(false);

        } catch (error: any) {
            console.error("Export failed:", error);
            alert("Export failed: " + (error.message || "Unknown error"));
            setExporting(false);
        }
    };

    const handleSendEmail = async () => {
        if (!clientEmail) {
            alert("Please enter a client email address");
            return;
        }

        setSendingEmail(true);

        try {
            // Update client email in DB
            if (companyId) {
                await fetch('/api/qbo/companies', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: companyId, client_email: clientEmail })
                });
            }

            // Generate PDF Blob
            const blob = await handleExport(true);
            if (!blob) {
                throw new Error("Failed to generate PDF");
            }

            // Convert Blob to Base64
            const reader = new FileReader();
            reader.readAsDataURL(blob as Blob);
            reader.onloadend = async () => {
                const base64String = (reader.result as string).split(',')[1];

                // Send Email as JSON
                const res = await fetch('/api/email/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: clientEmail,
                        subject: emailSubject,
                        body: emailBody,
                        fileBase64: base64String,
                        filename: `MIS_Report_${companyName.replace(/ /g, '_')}_${dateRange.start}_${dateRange.end}.pdf`
                    })
                });

                const result = await res.json();
                if (result.success) {
                    alert("Email sent successfully!");
                    setIsEmailOpen(false);
                } else {
                    alert("Failed to send email: " + result.error);
                }
                setSendingEmail(false);
            };

        } catch (e: any) {
            console.error("Email send failed", e);
            alert("Error sending email: " + e.message);
            setSendingEmail(false);
        }
    };

    // ─── Loading State ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: ACCENT }} />
                <p style={{ fontSize: "14px", color: TEXT_MUTED }}>Loading financial data…</p>
            </div>
        );
    }

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5 pb-10">

            {/* Report Header */}
            <ReportHeader dateRange={dateRange} />

            {/* ── Control Bar ── */}
            <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl px-5 py-4"
                style={{
                    background: "#FFFFFF",
                    border: `1px solid ${BORDER}`,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}
            >
                {/* Title */}
                <div>
                    <h2 className="font-bold" style={{ fontSize: "16px", color: NAVY }}>
                        Financial Analysis
                    </h2>
                    <p style={{ fontSize: "12px", color: TEXT_MUTED, marginTop: "2px" }}>
                        Performance Metrics & Insights
                    </p>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Preset Dropdown */}
                    <div className="flex items-center gap-2">
                        <span style={{ fontSize: "12px", color: TEXT_MUTED, fontWeight: 500 }}>Period</span>
                        <Select value={presetFilter} onValueChange={(val) => applyDatePreset(val)}>
                            <SelectTrigger className="w-[145px] h-8 text-xs bg-card border-border">
                                <SelectValue placeholder="Select Period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="last_month">Last Month</SelectItem>
                                <SelectItem value="current_month">Current Month</SelectItem>
                                <SelectItem value="last_year">Last Year</SelectItem>
                                <SelectItem value="current_year">Current Year</SelectItem>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="custom">Custom Date</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Range Inputs */}
                    <div className="flex items-center gap-2">
                        <span style={{ fontSize: "12px", color: TEXT_MUTED, fontWeight: 500 }}>From</span>
                        <input
                            type="date"
                            className="rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:ring-2"
                            style={{
                                border: `1px solid ${BORDER}`,
                                background: BG_SOFT,
                                color: TEXT_MAIN,
                                fontSize: "13px",
                            }}
                            value={dateRange.start}
                            onChange={(e) => {
                                setPresetFilter("custom");
                                setDateRange(prev => ({ ...prev, start: e.target.value }));
                            }}
                        />
                        <span style={{ fontSize: "12px", color: TEXT_MUTED, fontWeight: 500 }}>To</span>
                        <input
                            type="date"
                            className="rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:ring-2"
                            style={{
                                border: `1px solid ${BORDER}`,
                                background: BG_SOFT,
                                color: TEXT_MAIN,
                                fontSize: "13px",
                            }}
                            value={dateRange.end}
                            onChange={(e) => {
                                setPresetFilter("custom");
                                setDateRange(prev => ({ ...prev, end: e.target.value }));
                            }}
                        />
                    </div>

                    <Button
                        variant="outline"
                        onClick={fetchReports}
                        style={{ borderColor: BORDER, fontSize: "13px" }}
                    >
                        <RefreshCw className="mr-2 h-3.5 w-3.5" />
                        Refresh
                    </Button>

                    {/* Email Dialog */}
                    <Dialog open={isEmailOpen} onOpenChange={setIsEmailOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                style={{ borderColor: BORDER, fontSize: "13px" }}
                                onClick={() => {
                                    setEmailSubject(`MIS Report - ${companyName} - ${dateRange.start} to ${dateRange.end}`);
                                    setEmailBody(`Dear Client,\n\nPlease find attached the MIS Report for ${companyName} covering the period from ${dateRange.start} to ${dateRange.end}.\n\nBest regards,\nRISE360 Automation Reporting`);
                                }}
                            >
                                <Mail className="mr-2 h-3.5 w-3.5" />
                                Email Report
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Send MIS Report via Email</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Client Email</Label>
                                    <Input
                                        value={clientEmail}
                                        onChange={(e: any) => setClientEmail(e.target.value)}
                                        placeholder="client@example.com"
                                    />
                                    <p className="text-xs text-muted-foreground">This email will be saved for future reports.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Subject</Label>
                                    <Input
                                        value={emailSubject}
                                        onChange={(e: any) => setEmailSubject(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Message Body</Label>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={emailBody}
                                        onChange={(e) => setEmailBody(e.target.value)}
                                        rows={5}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEmailOpen(false)}>Cancel</Button>
                                <Button onClick={handleSendEmail} disabled={sendingEmail}>
                                    {sendingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {sendingEmail ? "Sending…" : "Send Report"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button
                        onClick={() => handleExport(false)}
                        disabled={loading || exporting || !pnlData}
                        style={{
                            background: NAVY,
                            color: "#FFFFFF",
                            fontSize: "13px",
                            border: "none",
                        }}
                    >
                        {exporting
                            ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            : <Download className="mr-2 h-3.5 w-3.5" />
                        }
                        {exporting ? "Exporting…" : "Export PDF"}
                    </Button>
                </div>
            </div>

            {/* ── KPI Cards ── */}
            {pnlData && (
                <>
                    <SectionDivider label="Executive Summary" />
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <KpiCard
                            label="Total Revenue"
                            value={totalIncome}
                            currency={currency}
                            sub={`100% of Revenue`}
                            accentColor="#1A6B3F"
                            trend="up"
                        />
                        <KpiCard
                            label="Total Expenses"
                            value={totalExpenses}
                            currency={currency}
                            sub={`Expense Ratio: ${expenseRatio.toFixed(1)}%`}
                            accentColor="#8B1A1A"
                            trend="down"
                        />
                        <KpiCard
                            label="Net Income / (Loss)"
                            value={netIncome}
                            currency={currency}
                            sub={`Net Margin: ${netMargin.toFixed(1)}%`}
                            accentColor={netIncome >= 0 ? "#1E3A5F" : "#8B1A1A"}
                            trend={netIncome >= 0 ? "up" : "down"}
                        />
                        <KpiCard
                            label="Gross Profit"
                            value={grossProfit}
                            currency={currency}
                            sub={`Gross Margin: ${grossMargin.toFixed(1)}%`}
                            accentColor="#2E86AB"
                            trend={grossProfit >= 0 ? "up" : "down"}
                        />
                    </div>

                    {/* Margin row */}
                    <div className="grid gap-4 md:grid-cols-3">
                        {[
                            { label: "Gross Margin", value: `${grossMargin.toFixed(2)}%`, color: "#1A6B3F" },
                            { label: "Net Margin", value: `${netMargin.toFixed(2)}%`, color: netMargin >= 0 ? "#1E3A5F" : "#8B1A1A" },
                            { label: "Expense Ratio", value: `${expenseRatio.toFixed(2)}%`, color: "#2E86AB" },
                        ].map((m) => (
                            <div
                                key={m.label}
                                className="flex items-center justify-between rounded-lg px-5 py-3"
                                style={{
                                    background: "#FFFFFF",
                                    border: `1px solid ${BORDER}`,
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <ArrowUpRight className="h-4 w-4" style={{ color: ACCENT }} />
                                    <span style={{ fontSize: "13px", color: TEXT_MUTED, fontWeight: 500 }}>
                                        {m.label}
                                    </span>
                                </div>
                                <span
                                    className="font-bold font-mono"
                                    style={{ fontSize: "16px", color: m.color }}
                                >
                                    {m.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Empty state */}
            {!pnlData && (
                <div
                    className="rounded-xl flex flex-col items-center justify-center py-20 gap-3"
                    style={{ background: "#FFFFFF", border: `1px solid ${BORDER}` }}
                >
                    <div
                        className="w-14 h-14 rounded-full flex items-center justify-center"
                        style={{ background: "#EEF4FB" }}
                    >
                        <Download className="h-6 w-6" style={{ color: ACCENT }} />
                    </div>
                    <p className="font-semibold" style={{ color: NAVY, fontSize: "15px" }}>
                        No Data Loaded
                    </p>
                    <p style={{ fontSize: "13px", color: TEXT_MUTED }}>
                        Select a reporting period and click Refresh to load financial data.
                    </p>
                </div>
            )}

            {/* ── Charts ── */}
            {pnlData && (
                <>
                    <SectionDivider label="Financial Charts" />
                    <div
                        className="rounded-xl px-6 py-5"
                        style={{
                            background: "#FFFFFF",
                            border: `1px solid ${BORDER}`,
                            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                        }}
                    >
                        <MisReportCharts
                            chartData={chartData}
                            topExpenses={topExpenses}
                            currency={currency}
                        />
                    </div>
                </>
            )}

            {/* ── Detailed Table ── */}
            {pnlData && (
                <>
                    <SectionDivider label="Detailed Breakdown" />
                    <FinancialTable
                        data={pnlData}
                        currency={currency}
                        totalIncome={totalIncome}
                    />
                </>
            )}
        </div>
    );
}
