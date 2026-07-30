"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, FileSpreadsheet, FileText, CheckCircle, Workflow, LayoutGrid, ArrowRight, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { read, utils } from "xlsx";
import { useStore } from "@/store/useStore";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";

interface DualUploadPanelProps {
    onExcelDataReady: (data: any[]) => void;
    selectedBankId: string;
    onBankSelect: (id: string) => void;
}

export function DualUploadPanel({ onExcelDataReady, selectedBankId, onBankSelect }: DualUploadPanelProps) {
    const selectedCompany = useStore(state => state.selectedCompany);
    const currentUser = useStore(state => state.user);
    // --- Excel Upload State ---
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [isParsingExcel, setIsParsingExcel] = useState(false);
    const [excelError, setExcelError] = useState<string | null>(null);
    const [excelDragOver, setExcelDragOver] = useState(false);

    // --- PDF / n8n Upload State ---
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [n8nStatus, setN8nStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
    const [n8nError, setN8nError] = useState<string | null>(null);
    const [pdfDragOver, setPdfDragOver] = useState(false);
    // Ref guard: prevents double-fire when both onDrop and onChange trigger simultaneously
    const isUploadingRef = useRef(false);

    // --- Bank Selection State ---
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [loadingBanks, setLoadingBanks] = useState(true);
    const [bankError, setBankError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBanks = async () => {
            if (!selectedCompany?.id) {
                setLoadingBanks(false);
                return;
            }
            setLoadingBanks(true);
            setBankError(null);
            try {
                const res = await fetch(`/api/qbo/accounts?type=Bank&companyId=${selectedCompany.id}`);
                if (res.status === 401) {
                    setBankError("Session expired. Please reconnect to QuickBooks.");
                    return;
                }
                if (!res.ok) throw new Error('Failed to fetch banks');
                const data = await res.json();
                const accounts = Array.isArray(data) ? data : (data.QueryResponse?.Account || []);
                setBankAccounts(accounts);
                if (accounts.length === 0) {
                    setBankError("No bank accounts found.");
                } else if (!selectedBankId && accounts.length > 0) {
                    onBankSelect(accounts[0].Id);
                }
            } catch (error) {
                setBankError("Unable to load bank accounts.");
            } finally {
                setLoadingBanks(false);
            }
        };
        fetchBanks();
    }, [selectedCompany?.id, selectedBankId, onBankSelect]);

    // --- Excel Upload Handler ---
    const handleExcelFile = async (file: File) => {
        if (!selectedBankId) {
            setExcelError("Please select a bank account first.");
            return;
        }
        if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
            setExcelError("Please upload an Excel or CSV file.");
            return;
        }
        setExcelFile(file);
        setExcelError(null);
        setIsParsingExcel(true);
        try {
            const buffer = await file.arrayBuffer();
            const workbook = read(buffer);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd', defval: "" });
            onExcelDataReady(jsonData);
        } catch (e: any) {
            setExcelError("Failed to parse Excel file. Please check the file format.");
        } finally {
            setIsParsingExcel(false);
        }
    };

    // --- PDF / n8n Upload Handler (fire-and-forget: upload → confirm → stay on page) ---
    const handlePdfUpload = async (file: File) => {
        if (!selectedBankId) {
            setN8nError("Please select a bank account first.");
            return;
        }
        // Block simultaneous calls (onDrop + onChange can both fire on a single drop)
        if (isUploadingRef.current) return;
        isUploadingRef.current = true;

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            setN8nError("Please upload a PDF file.");
            isUploadingRef.current = false;
            return;
        }

        const webhookUrl = localStorage.getItem("n8n_webhook_url");
        if (!webhookUrl) {
            setN8nError("n8n Webhook URL not configured. Please go to Settings → n8n Integration and save your webhook URL first.");
            return;
        }

        setPdfFile(file);
        setN8nError(null);
        setN8nStatus('uploading');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('webhookUrl', webhookUrl);
            // Attach company context so n8n knows where to post data back
            const selectedBank = bankAccounts.find(acc => acc.Id === selectedBankId);
            formData.append('company_id', selectedCompany.id || '');
            formData.append('company_name', selectedCompany.name || '');
            formData.append('user_id', currentUser?.id || '');
            formData.append('filename', file.name);
            formData.append('bank_account_id', selectedBankId);
            formData.append('bank_name', selectedBank?.Name || '');
            formData.append('bank_code', selectedBank?.AcctNum || '');

            setN8nStatus('processing');

            // Send PDF to n8n — we don't wait for extracted data back
            // n8n will process and push data to Finza via the public API
            await fetch('/api/parser-n8n', {
                method: 'POST',
                body: formData
            });

            // Always show success — n8n handles the rest in background
            setN8nStatus('done');

            // Auto-reset after 6 seconds so user can upload another
            setTimeout(() => {
                setN8nStatus('idle');
                setPdfFile(null);
                setN8nError(null);
                isUploadingRef.current = false; // Ready for next upload
            }, 6000);

        } catch (err: any) {
            setN8nError(err.message || "Failed to send PDF to n8n.");
            setN8nStatus('error');
            isUploadingRef.current = false; // Allow retry on error
        }
    };

    const dropHandlers = (onFile: (f: File) => void, setDragging: (b: boolean) => void) => ({
        onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragging(true); },
        onDragLeave: () => setDragging(false),
        onDrop: (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) onFile(file);
        }
    });

    return (
        <div className="space-y-6">
            {/* --- Bank Selector --- */}
            <div className="max-w-md mx-auto space-y-2 mb-6">
                <Label className="text-muted-foreground ml-1">Select Bank Account</Label>
                {bankError ? (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {bankError}
                    </div>
                ) : (
                    <Select value={selectedBankId || undefined} onValueChange={onBankSelect} disabled={loadingBanks || bankAccounts.length === 0}>
                        <SelectTrigger className="glass border-white/10 text-foreground h-12 shadow-md">
                            <SelectValue placeholder={loadingBanks ? "Loading accounts..." : "Select a Bank Account"} />
                        </SelectTrigger>
                        <SelectContent className="glass">
                            {bankAccounts.map((acc: any) => (
                                <SelectItem key={acc.Id} value={acc.Id} className="hover:bg-primary/20 cursor-pointer">
                                    <span className="font-medium mr-2">{acc.Name}</span>
                                    <span className="text-muted-foreground text-xs">({acc.CurrencyRef?.value || 'USD'})</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* === LEFT: RISE360 Automation Excel Upload === */}
                <Card className={cn("glass border-white/10 shadow-xl flex flex-col transition-all",
                    !selectedBankId && "opacity-50 pointer-events-none",
                    excelDragOver && "border-primary/50 bg-primary/5"
                )}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                                <FileSpreadsheet className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold text-foreground">RISE360 Direct</CardTitle>
                                <CardDescription className="text-xs">Upload Excel or CSV bank statements</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className="w-fit text-xs border-primary/30 text-primary bg-primary/10">Excel / CSV</Badge>
                            <div className="flex items-center gap-1.5 text-xs">
                                <a
                                    href="/sample_bank_statement.xlsx"
                                    download="sample_bank_statement.xlsx"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium bg-primary/10 px-2 py-1 rounded border border-primary/20"
                                >
                                    <Download className="h-3 w-3" />
                                    Sample .xlsx
                                </a>
                                <a
                                    href="/sample_bank_statement.csv"
                                    download="sample_bank_statement.csv"
                                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline px-2 py-1 rounded border border-white/10 bg-white/5"
                                >
                                    <Download className="h-3 w-3" />
                                    .csv
                                </a>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col space-y-4">
                        {excelError && (
                            <div className="p-3 rounded-lg text-xs bg-red-500/10 border border-red-500/20 text-red-400">{excelError}</div>
                        )}

                        <label
                            {...dropHandlers(handleExcelFile, setExcelDragOver)}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-colors min-h-[180px]",
                                selectedBankId ? "cursor-pointer" : "cursor-not-allowed",
                                excelFile && !excelError ? "border-primary/50 bg-primary/5" : "border-white/15 hover:border-primary/30 hover:bg-primary/5"
                            )}
                        >
                            <input
                                type="file"
                                className="hidden"
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => e.target.files?.[0] && handleExcelFile(e.target.files[0])}
                                disabled={!selectedBankId}
                            />
                            {isParsingExcel ? (
                                <div className="flex flex-col items-center gap-3 text-primary">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <p className="text-sm font-medium">Parsing...</p>
                                </div>
                            ) : excelFile && !excelError ? (
                                <div className="flex flex-col items-center gap-3 text-green-400">
                                    <CheckCircle className="h-8 w-8" />
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-foreground">{excelFile.name}</p>
                                        <p className="text-xs mt-1">Ready to process</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                    <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center">
                                        <Upload className="h-6 w-6" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-foreground">Drop Excel/CSV here</p>
                                        <p className="text-xs mt-1">or click to browse</p>
                                    </div>
                                </div>
                            )}
                        </label>

                        {excelFile && !isParsingExcel && !excelError && (
                            <Button
                                className="glow-primary w-full h-10 font-bold"
                                onClick={() => onExcelDataReady([])} // Will re-trigger with real data
                            >
                                Continue to Mapping
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* === RIGHT: n8n PDF Upload === */}
                <Card className={cn("glass border-white/10 shadow-xl flex flex-col transition-all",
                    !selectedBankId && "opacity-50 pointer-events-none",
                    pdfDragOver && "border-orange-500/50 bg-orange-500/5"
                )}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                                <Workflow className="h-5 w-5 text-orange-400" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold text-foreground">n8n AI Extraction</CardTitle>
                                <CardDescription className="text-xs">Upload PDF → n8n processes → data goes to RISE360</CardDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className="w-fit text-xs border-orange-500/30 text-orange-400 bg-orange-500/10">PDF via n8n</Badge>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col space-y-4">
                        {n8nError && (
                            <div className="p-3 rounded-lg text-xs bg-red-500/10 border border-red-500/20 text-red-400">{n8nError}</div>
                        )}

                        <label
                            {...dropHandlers(handlePdfUpload, setPdfDragOver)}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-colors min-h-[180px]",
                                selectedBankId ? "cursor-pointer" : "cursor-not-allowed",
                                n8nStatus === 'done' ? "border-green-500/50 bg-green-500/5" :
                                    n8nStatus === 'error' ? "border-red-500/50" :
                                        (pdfFile && n8nStatus !== 'idle') ? "border-orange-500/50 bg-orange-500/5" :
                                            "border-white/15 hover:border-orange-500/30 hover:bg-orange-500/5"
                            )}
                        >
                            <input
                                type="file"
                                className="hidden"
                                accept=".pdf"
                                onChange={(e) => e.target.files?.[0] && handlePdfUpload(e.target.files[0])}
                                disabled={!selectedBankId}
                            />

                            {n8nStatus === 'uploading' || n8nStatus === 'processing' ? (
                                <div className="flex flex-col items-center gap-3 text-orange-400">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <div className="text-center">
                                        <p className="text-sm font-medium">
                                            {n8nStatus === 'uploading' ? 'Uploading to n8n...' : 'AI Extracting Data...'}
                                        </p>
                                        <p className="text-xs mt-1 text-muted-foreground">This may take 30-60 seconds</p>
                                    </div>
                                </div>
                            ) : n8nStatus === 'done' ? (
                                <div className="flex flex-col items-center gap-3 text-green-400">
                                    <CheckCircle className="h-8 w-8" />
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-foreground">{pdfFile?.name}</p>
                                        <p className="text-xs mt-1">n8n extracted data — ready for review!</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                    <div className="h-12 w-12 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                        <FileText className="h-6 w-6 text-orange-400" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-foreground">Drop PDF here</p>
                                        <p className="text-xs mt-1">n8n will extract transactions automatically</p>
                                    </div>
                                </div>
                            )}
                        </label>

                        {/* n8n flow indicator */}
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> PDF</span>
                            <ArrowRight className="h-3 w-3 text-orange-400" />
                            <span className="flex items-center gap-1 text-orange-400"><Workflow className="h-3 w-3" /> n8n</span>
                            <ArrowRight className="h-3 w-3 text-primary" />
                            <span className="flex items-center gap-1 text-primary"><LayoutGrid className="h-3 w-3" /> RISE360</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
