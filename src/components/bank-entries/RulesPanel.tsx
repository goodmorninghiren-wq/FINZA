"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { useStore, Rule, RuleCondition, TransactionType } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
    Plus, Trash2, Save, Upload, Download, ArrowRight, SlidersHorizontal,
    Copy, RefreshCw, CloudUpload, CloudDownload, CheckCircle2, AlertCircle,
    MoreVertical, Pencil, BarChart3, Zap, AlertTriangle, TrendingUp, ChevronDown, ChevronUp, Filter
} from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { RuleBuilder } from "@/components/rules/RuleBuilder";
import * as XLSX from "xlsx";

const TRANSACTION_TYPES: TransactionType[] = [
    'Expense', 'Income', 'Transfer', 'Check', 'Bill', 'Purchase', 'Credit Card Credit', 'Credit Note', 'Journal Entry'
];

const TYPE_COLORS: Record<string, string> = {
    'Expense': 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    'Income': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    'Transfer': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    'Check': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    'Bill': 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    'Purchase': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    'Credit Card Credit': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    'Credit Note': 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    'Journal Entry': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

interface QBOSuggestion {
    id: string;
    suggestedName: string;
    keyword: string;
    accountName: string;
    accountRef: string;
    vendorRef?: string;
    vendorName?: string;
    transactionType: string;
    occurrences: number;
    samples: string[];
    conditions: RuleCondition[];
    actions: { ledger: string; contactId?: string };
}

interface SyncStats {
    purchasesScanned: number;
    depositsScanned: number;
    patternsFound: number;
    dateRange: { startDate: string; endDate: string };
}

export function RulesPanel() {
    const { rules, addRule, deleteRule, editRule, connectedCompanies, selectedCompany, fetchRules } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

    // QBO Data
    const [accounts, setAccounts] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);

    // QBO Sync State
    const [isSyncing, setIsSyncing] = useState(false);
    const [isPushing, setIsPushing] = useState(false);
    const [syncDialogOpen, setSyncDialogOpen] = useState(false);
    const [pushDialogOpen, setPushDialogOpen] = useState(false);
    const [qboSuggestions, setQboSuggestions] = useState<QBOSuggestion[]>([]);
    const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
    const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [lastSynced, setLastSynced] = useState<string | null>(null);
    const [syncSuccess, setSyncSuccess] = useState<{ imported?: number; exported?: number } | null>(null);

    // Push dialog state
    const [selectedPushRules, setSelectedPushRules] = useState<string[]>([]);

    // Import from client dialog
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importClient, setImportClient] = useState<string>("");
    const [clientRulesList, setClientRulesList] = useState<Rule[]>([]);
    const [selectedImportRules, setSelectedImportRules] = useState<string[]>([]);
    const [isFetchingClientRules, setIsFetchingClientRules] = useState(false);
    const [allClientsList, setAllClientsList] = useState<any[]>([]);

    // Form State
    const [ruleName, setRuleName] = useState("");
    const [ledger, setLedger] = useState("");
    const [ruleType, setRuleType] = useState<TransactionType>('Expense');
    const [contactId, setContactId] = useState<string>("");
    const [conditions, setConditions] = useState<RuleCondition[]>([
        { id: '1', field: 'Description', operator: 'contains', value: '' }
    ]);
    const [matchType, setMatchType] = useState<'AND' | 'OR'>('AND');
    const [autoApply, setAutoApply] = useState(true);

    const activeCompanyId = selectedCompany?.id || connectedCompanies[0]?.id;

    const fetchAllData = useCallback(async () => {
        const companyId = selectedCompany?.id || connectedCompanies[0]?.id;
        if (!companyId) return;
        fetchRules(companyId);
        try {
            const [accRes, venRes, cusRes] = await Promise.all([
                fetch(`/api/qbo/accounts?companyId=${companyId}`),
                fetch(`/api/qbo/vendors?companyId=${companyId}`),
                fetch(`/api/qbo/customers?companyId=${companyId}`)
            ]);
            if (accRes.ok) setAccounts(await accRes.json() || []);
            if (venRes.ok) setVendors(await venRes.json() || []);
            if (cusRes.ok) setCustomers(await cusRes.json() || []);
        } catch (error) {
            console.error("Failed to fetch QBO data", error);
        }
    }, [selectedCompany?.id, connectedCompanies, fetchRules]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    useEffect(() => {
        const fetchAllClients = async () => {
            try {
                const res = await fetch('/api/qbo/companies?all=true');
                if (res.ok) setAllClientsList(await res.json());
            } catch { /* ignore */ }
        };
        fetchAllClients();
    }, []);

    useEffect(() => {
        if (!importClient || !isImportOpen) return;
        const fetchClientRules = async () => {
            setIsFetchingClientRules(true);
            try {
                const res = await fetch(`/api/rules?companyId=${importClient}`);
                if (res.ok) setClientRulesList(await res.json());
            } catch { /* ignore */ }
            finally { setIsFetchingClientRules(false); }
        };
        fetchClientRules();
    }, [importClient, isImportOpen]);

    // ── Filtered & Searched Rules ─────────────────────────────────
    const currentCompanyRules = rules.filter(r =>
        r.client_id === activeCompanyId && r.is_active !== false
    );

    const displayedRules = currentCompanyRules.filter(r => {
        const typeMatch = filterType === 'All' || r.rule_type === filterType;
        const searchMatch = !searchQuery ||
            r.rule_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.actions?.ledger?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.conditions?.some(c => c.value.toLowerCase().includes(searchQuery.toLowerCase()));
        return typeMatch && searchMatch;
    });

    // ── Ledger Options ──────────────────────────────────────────────
    const incomeAccounts = accounts.filter(a => a.Classification === 'Revenue' || a.AccountType === 'Income' || a.AccountType === 'Other Income');
    const expenseAccounts = accounts.filter(a => a.Classification === 'Expense' || a.AccountType === 'Expense' || a.AccountType === 'Other Expense' || a.AccountType === 'Cost of Goods Sold');
    const bankAccounts = accounts.filter(a => a.AccountType === 'Bank' || a.AccountType === 'Credit Card');

    const getLedgerOptions = () => {
        if (ruleType === 'Income' || ruleType === 'Credit Note') return incomeAccounts;
        if (ruleType === 'Transfer') return bankAccounts;
        if (ruleType === 'Journal Entry') return accounts;
        return expenseAccounts.length > 0 ? expenseAccounts : accounts;
    };

    // ── Form Helpers ────────────────────────────────────────────────
    const resetForm = () => {
        setRuleName(""); setLedger(""); setRuleType('Expense');
        setContactId(""); setAutoApply(true);
        setConditions([{ id: Math.random().toString(36).substr(2, 9), field: 'Description', operator: 'contains', value: '' }]);
        setMatchType('AND'); setIsAdding(false); setEditingId(null);
    };

    const handleSave = async () => {
        if (!ruleName || !ledger || conditions.length === 0) return;
        const ruleData = {
            rule_name: ruleName, matchType, conditions, rule_type: ruleType,
            actions: { ledger, contactId: contactId || undefined },
            is_active: autoApply
        };
        if (editingId) {
            await editRule(editingId, ruleData);
        } else {
            await addRule({ client_id: selectedCompany.id, ...ruleData });
        }
        resetForm();
    };

    const startEdit = (rule: Rule) => {
        setRuleName(rule.rule_name);
        setConditions(rule.conditions || []);
        setMatchType(rule.matchType || 'AND');
        setRuleType(rule.rule_type || 'Expense');
        setContactId(rule.actions?.contactId || "");
        setLedger(rule.actions?.ledger || "");
        setAutoApply(rule.is_active !== false);
        setEditingId(rule.id);
        setIsAdding(true);
        setOpenMenuId(null);
    };

    const handleDuplicate = async (rule: Rule) => {
        await addRule({
            client_id: selectedCompany.id,
            rule_name: `${rule.rule_name} (Copy)`,
            conditions: rule.conditions,
            matchType: rule.matchType,
            rule_type: rule.rule_type,
            actions: rule.actions,
            is_active: true
        });
        setOpenMenuId(null);
    };

    const handleToggleActive = async (rule: Rule) => {
        await editRule(rule.id, { is_active: !rule.is_active });
    };

    // ── Import from Client ─────────────────────────────────────────
    const handleImport = async () => {
        if (!importClient || selectedImportRules.length === 0) return;
        const rulesToImport = clientRulesList.filter(r => selectedImportRules.includes(r.id));
        for (const r of rulesToImport) {
            await addRule({
                client_id: selectedCompany.id, rule_name: r.rule_name,
                conditions: r.conditions, matchType: r.matchType,
                rule_type: r.rule_type, actions: r.actions, is_active: true
            });
        }
        setIsImportOpen(false); setImportClient(""); setSelectedImportRules([]); setClientRulesList([]);
    };

    // ── QBO Sync: Pull suggestions from QBO ─────────────────────────
    const handleSyncFromQBO = async () => {
        if (!activeCompanyId) return;
        setIsSyncing(true); setSyncError(null); setQboSuggestions([]); setSyncStats(null);
        try {
            const res = await fetch(`/api/qbo/rules-sync?companyId=${activeCompanyId}`);
            if (!res.ok) {
                const err = await res.json();
                setSyncError(err.error || 'Failed to fetch QBO data');
            } else {
                const data = await res.json();
                setQboSuggestions(data.suggestions || []);
                setSyncStats(data.stats || null);
                setLastSynced(new Date().toLocaleTimeString());
                setSyncDialogOpen(true);
            }
        } catch (e: any) {
            setSyncError(e.message || 'Connection failed');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleImportSuggestions = async () => {
        if (selectedSuggestions.length === 0) return;
        const toImport = qboSuggestions.filter(s => selectedSuggestions.includes(s.id));
        const res = await fetch('/api/qbo/rules-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId: activeCompanyId, rules: toImport, direction: 'import' })
        });
        if (res.ok) {
            const result = await res.json();
            setSyncSuccess({ imported: result.imported });
            await fetchAllData();
        }
        setSyncDialogOpen(false); setSelectedSuggestions([]);
    };

    // ── QBO Push: Export rules to QBO ───────────────────────────────
    const handlePushToQBO = async () => {
        if (!activeCompanyId || selectedPushRules.length === 0) return;
        setIsPushing(true);
        try {
            const rulesToPush = currentCompanyRules.filter(r => selectedPushRules.includes(r.id));
            const res = await fetch('/api/qbo/rules-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId: activeCompanyId, rules: rulesToPush, direction: 'export' })
            });
            if (res.ok) {
                const result = await res.json();
                // Download exported payload as JSON
                const blob = new Blob([JSON.stringify(result.exportPayload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `FINZA_Rules_QBO_Export_${new Date().toISOString().split('T')[0]}.json`;
                a.click(); URL.revokeObjectURL(url);
                setSyncSuccess({ exported: result.exported });
            }
        } catch (e: any) {
            setSyncError(e.message);
        } finally {
            setIsPushing(false);
            setPushDialogOpen(false);
        }
    };

    // ── Excel Export ───────────────────────────────────────────────
    const handleExcelExport = () => {
        if (currentCompanyRules.length === 0) { alert("No rules to export."); return; }
        const data = currentCompanyRules.map(rule => ({
            "Rule Name": rule.rule_name,
            "Transaction Type": rule.rule_type,
            "Match Type": rule.matchType,
            "Values": rule.conditions?.map(c => `${c.field}|${c.operator}|${c.value}`).join(";; "),
            "Ledger Account": rule.actions.ledger,
            "Contact Name": [...customers, ...vendors].find((c: any) => c.Id === rule.actions.contactId)?.DisplayName || ""
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rules");
        XLSX.writeFile(wb, `Rules_Export_${selectedCompany.name.replace(/ /g, "_")}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // ── Excel Import ───────────────────────────────────────────────
    const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const wb = XLSX.read(evt.target?.result, { type: "binary" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data: any[] = XLSX.utils.sheet_to_json(ws);
            if (data.length === 0) { alert("No data found in Excel file."); return; }
            let count = 0;
            for (const row of data) {
                const conditionsRaw = row["Values"] || "";
                const parsedConditions = conditionsRaw.split(";; ").map((cStr: string) => {
                    const parts = cStr.split("|");
                    if (parts.length === 3) return { id: Math.random().toString(36).substr(2, 9), field: parts[0], operator: parts[1], value: parts[2] };
                    return null;
                }).filter(Boolean);
                let cId = undefined;
                if (row["Contact Name"]) {
                    const contact = [...customers, ...vendors].find((c: any) => c.DisplayName === row["Contact Name"]);
                    if (contact) cId = contact.Id;
                }
                await addRule({
                    client_id: selectedCompany.id,
                    rule_name: row["Rule Name"] || `Imported Rule ${count + 1}`,
                    rule_type: row["Transaction Type"] || "Expense",
                    matchType: row["Match Type"] || "AND",
                    conditions: parsedConditions.length > 0 ? parsedConditions : [{ id: Math.random().toString(36).substr(2, 9), field: 'Description', operator: 'contains', value: '' }],
                    actions: { ledger: row["Ledger Account"] || "Uncategorized", contactId: cId },
                    is_active: true
                });
                count++;
            }
            alert(`Successfully imported ${count} rules.`);
            e.target.value = "";
        };
        reader.readAsBinaryString(file);
    };

    // ── Condition Summary ──────────────────────────────────────────
    const getConditionSummary = (rule: Rule) => {
        if (!rule.conditions || rule.conditions.length === 0) return "No conditions";
        const first = rule.conditions[0];
        const summary = `${first.field} ${first.operator.replace('_', ' ')} "${first.value}"`;
        return rule.conditions.length > 1 ? `${summary} +${rule.conditions.length - 1} more` : summary;
    };

    const availableClients = allClientsList.filter(c => c.id !== selectedCompany?.id);
    const ledgerOptions = getLedgerOptions();

    // ── Stats ─────────────────────────────────────────────────────
    const stats = {
        total: currentCompanyRules.length,
        expense: currentCompanyRules.filter(r => r.rule_type === 'Expense').length,
        income: currentCompanyRules.filter(r => r.rule_type === 'Income').length,
        other: currentCompanyRules.filter(r => !['Expense', 'Income'].includes(r.rule_type)).length,
    };

    return (
        <div className="flex flex-col h-full gap-0">

            {/* ── QBO Sync Bar ─────────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-gradient-to-r from-primary/5 via-card to-primary/5 p-3.5 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <Zap className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">QBO Rule Sync</p>
                        <p className="text-xs text-muted-foreground">
                            {lastSynced ? `Last synced: ${lastSynced}` : 'Sync rules with QuickBooks Online'}
                        </p>
                    </div>
                    {syncSuccess && (
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {syncSuccess.imported !== undefined && `${syncSuccess.imported} rules imported`}
                            {syncSuccess.exported !== undefined && `${syncSuccess.exported} rules exported`}
                        </div>
                    )}
                    {syncError && (
                        <div className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/20 rounded-lg px-2.5 py-1 text-xs text-destructive font-medium">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {syncError}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 gap-1.5"
                        onClick={handleSyncFromQBO}
                        disabled={isSyncing || !activeCompanyId}
                    >
                        {isSyncing ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <CloudDownload className="h-3.5 w-3.5" />
                        )}
                        {isSyncing ? 'Scanning QBO...' : 'Pull from QBO'}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
                        onClick={() => {
                            setSelectedPushRules(currentCompanyRules.map(r => r.id));
                            setPushDialogOpen(true);
                        }}
                        disabled={isPushing || !activeCompanyId || currentCompanyRules.length === 0}
                    >
                        {isPushing ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <CloudUpload className="h-3.5 w-3.5" />
                        )}
                        Push to QBO
                    </Button>
                </div>
            </div>

            {/* ── Stats Row ────────────────────────────────────────────── */}
            <div className="grid grid-cols-4 gap-2.5 mb-4">
                {[
                    { label: 'Total Rules', value: stats.total, icon: SlidersHorizontal, color: 'text-primary' },
                    { label: 'Expense', value: stats.expense, icon: TrendingUp, color: 'text-red-500' },
                    { label: 'Income', value: stats.income, icon: BarChart3, color: 'text-emerald-500' },
                    { label: 'Other', value: stats.other, icon: Filter, color: 'text-blue-500' },
                ].map(s => (
                    <div key={s.label} className="rounded-xl border border-border bg-card p-3 flex items-center gap-2.5">
                        <s.icon className={`h-4 w-4 ${s.color} flex-shrink-0`} />
                        <div>
                            <p className="text-lg font-bold text-foreground leading-none">{s.value}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="flex flex-col gap-3 py-3 px-4 border-b border-border">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">Automation Rules</CardTitle>
                        <div className="flex items-center gap-2">
                            {/* Import from client */}
                            <Button
                                variant="ghost" size="sm"
                                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                                onClick={() => setIsImportOpen(true)}
                                title="Import rules from another client"
                            >
                                <Copy className="h-3.5 w-3.5" /> Copy
                            </Button>
                            {/* Excel import */}
                            <Button
                                variant="ghost" size="sm"
                                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                                onClick={() => document.getElementById('rule-import-input')?.click()}
                                title="Import from Excel"
                            >
                                <Upload className="h-3.5 w-3.5" /> Excel
                            </Button>
                            <input type="file" id="rule-import-input" className="hidden" accept=".xlsx,.xls" onChange={handleExcelImport} />
                            {/* Excel export */}
                            <Button
                                variant="ghost" size="sm"
                                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                                onClick={handleExcelExport}
                                title="Export to Excel"
                            >
                                <Download className="h-3.5 w-3.5" /> Export
                            </Button>
                            {/* Add rule */}
                            <Button
                                size="sm"
                                className="h-7 text-xs glow-primary gap-1 font-medium"
                                onClick={() => setIsAdding(true)}
                            >
                                <Plus className="h-3.5 w-3.5" /> New Rule
                            </Button>
                        </div>
                    </div>

                    {/* Search + Filter Row */}
                    <div className="flex gap-2">
                        <Input
                            className="h-7 text-xs flex-1 bg-muted/30 border-border"
                            placeholder="Search rules, accounts, conditions..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="h-7 text-xs w-[130px] bg-muted/30 border-border">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Types</SelectItem>
                                {TRANSACTION_TYPES.map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">

                    {/* ── Create/Edit Sheet ──────────────────────────────── */}
                    <Sheet open={isAdding} onOpenChange={(open) => { if (!open) resetForm(); else setIsAdding(true); }}>
                        <SheetContent side="right" className="sm:max-w-lg w-full bg-card border-l border-border flex flex-col overflow-y-auto p-0">
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                                <SheetHeader className="p-0 space-y-1">
                                    <SheetTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                                            <SlidersHorizontal className="h-4 w-4 text-primary" />
                                        </div>
                                        {editingId ? 'Edit Rule' : 'Create Rule'}
                                    </SheetTitle>
                                    <SheetDescription className="text-xs text-muted-foreground">
                                        Automatically categorize bank transactions in QBO
                                    </SheetDescription>
                                </SheetHeader>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                                {/* Rule Name */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">Rule Name</Label>
                                    <Input
                                        className="h-9 text-sm bg-background border-input text-foreground font-medium"
                                        value={ruleName}
                                        onChange={e => setRuleName(e.target.value)}
                                        placeholder="e.g. Uber Travel Expenses"
                                    />
                                </div>

                                {/* Money Direction Selector */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Applies To</Label>
                                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/30 rounded-lg border border-border">
                                        {[
                                            { label: 'All', values: ['Expense', 'Income', 'Transfer', 'Check', 'Bill', 'Purchase', 'Credit Card Credit', 'Credit Note', 'Journal Entry'] as TransactionType[] },
                                            { label: '💸 Money Out', values: ['Expense', 'Check', 'Bill', 'Purchase'] as TransactionType[] },
                                            { label: '💰 Money In', values: ['Income', 'Credit Note', 'Credit Card Credit'] as TransactionType[] },
                                        ].map(dir => {
                                            const isActive = dir.label === 'All'
                                                ? true
                                                : dir.values.includes(ruleType);
                                            return (
                                                <button
                                                    key={dir.label}
                                                    onClick={() => dir.values.length > 0 && setRuleType(dir.values[0])}
                                                    className={`text-xs py-1.5 px-2 rounded-md font-medium transition-all ${isActive && dir.label !== 'All'
                                                        ? 'bg-primary text-primary-foreground shadow'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                        }`}
                                                >
                                                    {dir.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Condition Builder */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        IF — Conditions
                                    </Label>
                                    <RuleBuilder
                                        conditions={conditions}
                                        matchType={matchType}
                                        onChange={(newConditions, newType) => {
                                            setConditions(newConditions);
                                            setMatchType(newType);
                                        }}
                                    />
                                </div>

                                {/* THEN: Action Section */}
                                <div className="space-y-3 p-4 rounded-xl border border-border bg-primary/3">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <ArrowRight className="h-3.5 w-3.5 text-primary" />
                                        THEN — Apply Action
                                    </Label>

                                    <div className="space-y-3">
                                        {/* Transaction Type */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-foreground">Transaction Type</Label>
                                            <Select value={ruleType} onValueChange={(val: TransactionType) => {
                                                setRuleType(val); setLedger(""); setContactId("");
                                            }}>
                                                <SelectTrigger className="h-9 text-sm bg-background border-input text-foreground">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TRANSACTION_TYPES.map(t => (
                                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Ledger Account */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-foreground">
                                                {ruleType === 'Transfer' ? 'Destination Account' : ruleType === 'Income' ? 'Income Ledger' : 'Expense Ledger'}
                                            </Label>
                                            <SearchableSelect
                                                value={ledger}
                                                onValueChange={setLedger}
                                                options={Array.from(new Map(ledgerOptions.map(a => [a.Name, a])).values()).map(a => ({
                                                    value: a.Name,
                                                    label: a.Name,
                                                    sublabel: a.AccountType ? `(${a.AccountType})` : undefined
                                                }))}
                                                placeholder="Search Account / Ledger..."
                                                searchPlaceholder="Type account name..."
                                            />
                                        </div>

                                        {/* Vendor/Customer */}
                                        {!['Transfer', 'Journal Entry'].includes(ruleType) && (
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-foreground">
                                                    {['Income', 'Credit Note'].includes(ruleType) ? 'Customer (Optional)' : 'Vendor (Optional)'}
                                                </Label>
                                                <SearchableSelect
                                                    value={contactId}
                                                    onValueChange={setContactId}
                                                    options={[
                                                        { value: "none", label: "None (No Contact)" },
                                                        ...(['Income', 'Credit Note'].includes(ruleType) ? customers : vendors).map((c: any) => ({
                                                            value: c.Id,
                                                            label: c.DisplayName || c.CompanyName || c.Id
                                                        }))
                                                    ]}
                                                    placeholder={['Income', 'Credit Note'].includes(ruleType) ? "Search Customer..." : "Search Vendor..."}
                                                    searchPlaceholder="Type to search..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Auto-apply toggle */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                                    <div>
                                        <p className="text-xs font-semibold text-foreground">Auto-apply Rule</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">Automatically apply when uploading bank statements</p>
                                    </div>
                                    <Switch
                                        checked={autoApply}
                                        onCheckedChange={setAutoApply}
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <SheetFooter className="px-6 py-4 border-t border-border flex flex-row gap-2 justify-end bg-muted/20">
                                <Button variant="outline" onClick={resetForm} className="border-border text-foreground">
                                    Cancel
                                </Button>
                                <Button
                                    className="glow-primary font-semibold flex-1"
                                    onClick={() => void handleSave()}
                                    disabled={!ruleName || !ledger}
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {editingId ? 'Update Rule' : 'Save Rule'}
                                </Button>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>

                    {/* ── Rule List ─────────────────────────────────────────── */}
                    {displayedRules.length > 0 ? displayedRules.map((rule, idx) => (
                        <div
                            key={rule.id}
                            className="group relative rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex items-start gap-3 p-3.5">
                                {/* Priority number */}
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-muted/60 border border-border flex items-center justify-center mt-0.5">
                                    <span className="text-[10px] font-bold text-muted-foreground">{idx + 1}</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    {/* Rule Name + Type */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                            {rule.rule_name}
                                        </p>
                                        {rule.rule_type && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${TYPE_COLORS[rule.rule_type] || TYPE_COLORS['Expense']}`}>
                                                {rule.rule_type}
                                            </span>
                                        )}
                                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0 ${rule.matchType === 'OR'
                                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                            : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                            }`}>
                                            {rule.matchType}
                                        </span>
                                    </div>

                                    {/* Condition summary */}
                                    <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                                        IF {getConditionSummary(rule)}
                                    </p>

                                    {/* Action */}
                                    <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-border/40">
                                        <ArrowRight className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                        <span className="text-xs font-semibold text-foreground truncate">
                                            {rule.actions.ledger}
                                        </span>
                                        {rule.actions.contactId && (
                                            <span className="text-xs text-muted-foreground truncate">
                                                • {[...customers, ...vendors].find((c: any) => c.Id === rule.actions.contactId)?.DisplayName || 'Contact'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Right controls */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* ON/OFF toggle */}
                                    <Switch
                                        checked={rule.is_active !== false}
                                        onCheckedChange={() => handleToggleActive(rule)}
                                        className="data-[state=checked]:bg-primary scale-90"
                                    />

                                    {/* Kebab menu */}
                                    <div className="relative">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === rule.id ? null : rule.id);
                                            }}
                                        >
                                            <MoreVertical className="h-3.5 w-3.5" />
                                        </Button>

                                        {openMenuId === rule.id && (
                                            <div className="absolute right-0 top-8 z-50 bg-card border border-border rounded-xl shadow-xl py-1 w-40">
                                                <button
                                                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-accent rounded-md mx-1 w-[calc(100%-8px)]"
                                                    onClick={() => startEdit(rule)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" /> Edit Rule
                                                </button>
                                                <button
                                                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-accent rounded-md mx-1 w-[calc(100%-8px)]"
                                                    onClick={() => handleDuplicate(rule)}
                                                >
                                                    <Copy className="h-3.5 w-3.5" /> Duplicate
                                                </button>
                                                <div className="border-t border-border my-1" />
                                                <button
                                                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-md mx-1 w-[calc(100%-8px)]"
                                                    onClick={() => {
                                                        void deleteRule(rule.id);
                                                        setOpenMenuId(null);
                                                    }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-14 px-4 rounded-xl border border-dashed border-border bg-muted/10">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                                <SlidersHorizontal className="h-6 w-6 text-primary" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                                {searchQuery || filterType !== 'All' ? 'No matching rules found' : 'No rules yet'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
                                {searchQuery || filterType !== 'All'
                                    ? 'Try adjusting your search or filter'
                                    : 'Click "New Rule" or pull rules from QBO to get started'}
                            </p>
                            {!searchQuery && filterType === 'All' && (
                                <div className="flex gap-2 justify-center mt-4">
                                    <Button size="sm" className="h-7 text-xs glow-primary" onClick={() => setIsAdding(true)}>
                                        <Plus className="h-3.5 w-3.5 mr-1" /> New Rule
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleSyncFromQBO} disabled={isSyncing}>
                                        <CloudDownload className="h-3.5 w-3.5 mr-1" /> Pull from QBO
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ────────────────────────────────────────────────────────── */}
            {/* QBO Sync Dialog — Import suggestions from QBO             */}
            {/* ────────────────────────────────────────────────────────── */}
            <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
                <DialogContent className="sm:max-w-[640px] max-h-[90vh] flex flex-col bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-foreground">
                            <CloudDownload className="h-5 w-5 text-primary" />
                            QBO Rule Suggestions
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-xs">
                            {syncStats && (
                                <span>
                                    Scanned {syncStats.purchasesScanned} expenses + {syncStats.depositsScanned} deposits
                                    from {syncStats.dateRange.startDate} to {syncStats.dateRange.endDate}.
                                    Found <strong className="text-foreground">{syncStats.patternsFound} recurring patterns</strong>.
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-2 py-2">
                        {qboSuggestions.length === 0 ? (
                            <div className="text-center py-8">
                                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                                <p className="text-sm font-medium text-foreground">No patterns found</p>
                                <p className="text-xs text-muted-foreground mt-1">QBO needs more categorized transactions (min. 2 occurrences per pattern)</p>
                            </div>
                        ) : (
                            <>
                                {/* Select all */}
                                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border sticky top-0 z-10 backdrop-blur-sm">
                                    <Checkbox
                                        id="select-all-qbo"
                                        checked={qboSuggestions.length > 0 && qboSuggestions.every(s => selectedSuggestions.includes(s.id))}
                                        onCheckedChange={(checked: boolean) => {
                                            setSelectedSuggestions(checked ? qboSuggestions.map(s => s.id) : []);
                                        }}
                                    />
                                    <Label htmlFor="select-all-qbo" className="text-xs font-semibold text-foreground cursor-pointer">
                                        Select All ({qboSuggestions.length} suggestions)
                                    </Label>
                                    {selectedSuggestions.length > 0 && (
                                        <span className="ml-auto text-xs text-primary font-medium">{selectedSuggestions.length} selected</span>
                                    )}
                                </div>

                                {qboSuggestions.map(s => (
                                    <div
                                        key={s.id}
                                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedSuggestions.includes(s.id)
                                            ? 'border-primary/40 bg-primary/5'
                                            : 'border-border bg-card hover:bg-accent/30'
                                            }`}
                                        onClick={() => {
                                            setSelectedSuggestions(prev =>
                                                prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                            );
                                        }}
                                    >
                                        <Checkbox
                                            checked={selectedSuggestions.includes(s.id)}
                                            onCheckedChange={() => { }}
                                            className="mt-0.5"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-semibold text-foreground truncate">{s.suggestedName}</p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${TYPE_COLORS[s.transactionType] || TYPE_COLORS['Expense']}`}>
                                                    {s.transactionType}
                                                </span>
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground flex-shrink-0">
                                                    {s.occurrences}× seen
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                IF description contains <span className="font-mono text-foreground">&quot;{s.keyword}&quot;</span>
                                                {' '} → <span className="font-semibold text-foreground">{s.accountName}</span>
                                            </p>
                                            {s.samples.length > 0 && (
                                                <p className="text-[10px] text-muted-foreground/70 mt-1 italic truncate">
                                                    e.g. &quot;{s.samples[0]}&quot;
                                                </p>
                                            )}
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    <DialogFooter className="border-t border-border pt-3 gap-2">
                        <Button variant="outline" onClick={() => setSyncDialogOpen(false)} className="border-border">
                            Cancel
                        </Button>
                        <Button
                            className="glow-primary font-semibold"
                            onClick={handleImportSuggestions}
                            disabled={selectedSuggestions.length === 0}
                        >
                            <CloudDownload className="h-4 w-4 mr-2" />
                            Import {selectedSuggestions.length > 0 ? `${selectedSuggestions.length} Rules` : 'Selected'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ────────────────────────────────────────────────────────── */}
            {/* Push to QBO Dialog                                        */}
            {/* ────────────────────────────────────────────────────────── */}
            <Dialog open={pushDialogOpen} onOpenChange={setPushDialogOpen}>
                <DialogContent className="sm:max-w-[560px] max-h-[85vh] flex flex-col bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-foreground">
                            <CloudUpload className="h-5 w-5 text-emerald-500" />
                            Push Rules to QBO
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Select rules to export. This will apply them to categorize existing QBO transactions and download a JSON manifest for accountants.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-2 py-2">
                        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border sticky top-0 z-10 backdrop-blur-sm">
                            <Checkbox
                                id="select-all-push"
                                checked={currentCompanyRules.length > 0 && currentCompanyRules.every(r => selectedPushRules.includes(r.id))}
                                onCheckedChange={(checked: boolean) => {
                                    setSelectedPushRules(checked ? currentCompanyRules.map(r => r.id) : []);
                                }}
                            />
                            <Label htmlFor="select-all-push" className="text-xs font-semibold text-foreground cursor-pointer">
                                Select All ({currentCompanyRules.length} rules)
                            </Label>
                        </div>

                        {currentCompanyRules.map(rule => (
                            <div
                                key={rule.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedPushRules.includes(rule.id)
                                    ? 'border-emerald-500/40 bg-emerald-500/5'
                                    : 'border-border bg-card hover:bg-accent/30'
                                    }`}
                                onClick={() => setSelectedPushRules(prev =>
                                    prev.includes(rule.id) ? prev.filter(id => id !== rule.id) : [...prev, rule.id]
                                )}
                            >
                                <Checkbox checked={selectedPushRules.includes(rule.id)} onCheckedChange={() => { }} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">{rule.rule_name}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {getConditionSummary(rule)} → {rule.actions.ledger}
                                    </p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${TYPE_COLORS[rule.rule_type] || TYPE_COLORS['Expense']}`}>
                                    {rule.rule_type}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                            This exports a JSON manifest file and applies rules to categorize QBO transactions. QBO&apos;s public API does not support direct bank rule creation.
                        </p>
                    </div>

                    <DialogFooter className="border-t border-border pt-3 gap-2">
                        <Button variant="outline" onClick={() => setPushDialogOpen(false)} className="border-border">
                            Cancel
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            onClick={handlePushToQBO}
                            disabled={selectedPushRules.length === 0 || isPushing}
                        >
                            {isPushing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <CloudUpload className="h-4 w-4 mr-2" />}
                            {isPushing ? 'Exporting...' : `Export ${selectedPushRules.length > 0 ? `${selectedPushRules.length} Rules` : ''}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ────────────────────────────────────────────────────────── */}
            {/* Import from Client Dialog                                 */}
            {/* ────────────────────────────────────────────────────────── */}
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogContent className="sm:max-w-[500px] bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-foreground">
                            <Copy className="h-4 w-4 text-primary" />
                            Copy Rules from Client
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Import automation rules from another connected client.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-foreground">Source Client</Label>
                            <Select value={importClient} onValueChange={setImportClient}>
                                <SelectTrigger className="bg-background border-input">
                                    <SelectValue placeholder="Choose client..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableClients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                    ))}
                                    {availableClients.length === 0 && (
                                        <div className="p-2 text-xs text-muted-foreground italic">No other clients connected</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {importClient && (
                            <div className="border border-border rounded-xl p-2 h-[280px] overflow-y-auto bg-muted/10">
                                <div className="flex items-center gap-2 p-2 border-b border-border mb-2 sticky top-0 bg-card/80 backdrop-blur-sm z-10 rounded-t-lg">
                                    <Checkbox
                                        id="select-all-import"
                                        checked={clientRulesList.length > 0 && clientRulesList.every(r => selectedImportRules.includes(r.id))}
                                        onCheckedChange={(checked: boolean) =>
                                            setSelectedImportRules(checked ? clientRulesList.map(r => r.id) : [])
                                        }
                                    />
                                    <Label htmlFor="select-all-import" className="text-xs font-semibold cursor-pointer text-foreground">
                                        Select All
                                    </Label>
                                </div>
                                {isFetchingClientRules ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                                    </div>
                                ) : clientRulesList.length === 0 ? (
                                    <p className="text-center text-xs text-muted-foreground mt-8">No rules found for this client.</p>
                                ) : (
                                    clientRulesList.map(rule => (
                                        <div key={rule.id} className="flex items-start gap-2 p-2 hover:bg-accent rounded-lg transition-colors cursor-pointer"
                                            onClick={() => setSelectedImportRules(prev =>
                                                prev.includes(rule.id) ? prev.filter(id => id !== rule.id) : [...prev, rule.id]
                                            )}
                                        >
                                            <Checkbox checked={selectedImportRules.includes(rule.id)} onCheckedChange={() => { }} className="mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{rule.rule_name}</p>
                                                <p className="text-xs text-muted-foreground">{getConditionSummary(rule)} → {rule.actions.ledger}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsImportOpen(false)} className="border-border">Cancel</Button>
                        <Button onClick={handleImport} disabled={!importClient || selectedImportRules.length === 0} className="glow-primary">
                            Import {selectedImportRules.length > 0 ? `${selectedImportRules.length} Rules` : 'Selected'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Click outside to close kebab menu */}
            {openMenuId && (
                <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
            )}
        </div>
    );
}
