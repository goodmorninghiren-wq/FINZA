"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useStore, Rule, RuleCondition, TransactionType } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, X, Save, Upload, Download, ArrowRight, Settings2, SlidersHorizontal, Copy } from "lucide-react";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { RuleBuilder } from "@/components/rules/RuleBuilder";
import * as XLSX from "xlsx";

const TRANSACTION_TYPES: TransactionType[] = [
    'Expense', 'Income', 'Transfer', 'Check', 'Bill', 'Purchase', 'Credit Card Credit', 'Credit Note', 'Journal Entry'
];


export function RulesPanel() {
    const { rules, addRule, deleteRule, editRule, connectedCompanies, selectedCompany, fetchRules } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // QBO Data State - Moved to top to avoid ReferenceError
    const [accounts, setAccounts] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);

    // Fetch all relevant data when company changes
    useEffect(() => {
        const companyId = selectedCompany?.id || connectedCompanies[0]?.id;
        if (!companyId) return;

        const fetchData = async () => {
            // Fetch Rules
            fetchRules(companyId);

            // Fetch QBO Data (Accounts, Vendors, Customers)
            try {
                console.log(`[RulesPanel] Fetching data for company ${companyId}...`);
                const [accRes, venRes, cusRes] = await Promise.all([
                    fetch(`/api/qbo/accounts?companyId=${companyId}`),
                    fetch(`/api/qbo/vendors?companyId=${companyId}`),
                    fetch(`/api/qbo/customers?companyId=${companyId}`)
                ]);

                if (accRes.ok) {
                    const data = await accRes.json();
                    console.log('[RulesPanel] Accounts fetched:', data?.length);
                    setAccounts(data || []);
                } else {
                    console.error('[RulesPanel] Failed to fetch accounts', accRes.status);
                }

                if (venRes.ok) {
                    const data = await venRes.json();
                    console.log('[RulesPanel] Vendors fetched:', data?.length);
                    setVendors(data || []);
                } else {
                    console.error('[RulesPanel] Failed to fetch vendors', venRes.status);
                }

                if (cusRes.ok) {
                    const data = await cusRes.json();
                    console.log('[RulesPanel] Customers fetched:', data?.length);
                    setCustomers(data || []);
                } else {
                    console.error('[RulesPanel] Failed to fetch customers', cusRes.status);
                }
            } catch (error) {
                console.error("Failed to fetch QBO data", error);
            }
        };

        fetchData();
    }, [selectedCompany?.id, connectedCompanies, fetchRules]);

    // Debug State Changes
    useEffect(() => {
        console.log('[RulesPanel] State - Accounts:', accounts.length);
        console.log('[RulesPanel] State - Vendors:', vendors.length);
        console.log('[RulesPanel] State - Customers:', customers.length);
    }, [accounts, vendors, customers]);

    // Filter rules for current company
    const activeCompanyId = selectedCompany?.id || connectedCompanies[0]?.id;
    const currentCompanyRules = rules.filter(r => r.client_id === activeCompanyId && r.is_active !== false);

    // Form State for Main Panel
    const [ruleName, setRuleName] = useState("");
    const [ledger, setLedger] = useState("");
    const [ruleType, setRuleType] = useState<TransactionType>('Expense');
    const [contactId, setContactId] = useState<string>("");

    // Advanced Rule State
    const [conditions, setConditions] = useState<RuleCondition[]>([
        { id: '1', field: 'Description', operator: 'contains', value: '' }
    ]);
    const [matchType, setMatchType] = useState<'AND' | 'OR'>('AND');

    // QBO Data State declarations moved to top

    // Filtered lists based on Type
    const incomeAccounts = accounts.filter(a => a.Classification === 'Revenue' || a.AccountType === 'Income' || a.AccountType === 'Other Income');
    const expenseAccounts = accounts.filter(a => a.Classification === 'Expense' || a.AccountType === 'Expense' || a.AccountType === 'Other Expense' || a.AccountType === 'Cost of Goods Sold');
    const bankAccounts = accounts.filter(a => a.AccountType === 'Bank' || a.AccountType === 'Credit Card');

    const getLedgerOptions = () => {
        if (ruleType === 'Income' || ruleType === 'Credit Note') return incomeAccounts;
        if (ruleType === 'Transfer') return bankAccounts;
        if (ruleType === 'Journal Entry') return accounts;
        return expenseAccounts.length > 0 ? expenseAccounts : accounts;
    };

    const ledgerOptions = getLedgerOptions();

    // Import Dialog State
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importClient, setImportClient] = useState<string>("");
    const [clientRulesList, setClientRulesList] = useState<Rule[]>([]);
    const [selectedImportRules, setSelectedImportRules] = useState<string[]>([]);
    const [isFetchingClientRules, setIsFetchingClientRules] = useState(false);
    const [allClientsList, setAllClientsList] = useState<any[]>([]);

    // Fetch all clients (including inactive) for the import modal
    useEffect(() => {
        const fetchAllClients = async () => {
            try {
                const res = await fetch('/api/qbo/companies?all=true');
                if (res.ok) {
                    const data = await res.json();
                    setAllClientsList(data);
                }
            } catch (error) {
                console.error("Failed to fetch all clients", error);
            }
        };
        fetchAllClients();
    }, []);

    // Fetch rules for the selected import client
    useEffect(() => {
        if (!importClient || !isImportOpen) return;

        const fetchClientRules = async () => {
            setIsFetchingClientRules(true);
            try {
                const res = await fetch(`/api/rules?companyId=${importClient}`);
                if (res.ok) {
                    const data = await res.json();
                    setClientRulesList(data);
                }
            } catch (error) {
                console.error("Failed to fetch client rules", error);
            } finally {
                setIsFetchingClientRules(false);
            }
        };

        fetchClientRules();
    }, [importClient, isImportOpen]);

    const resetForm = () => {
        setRuleName("");
        setLedger("");
        setRuleType('Expense');
        setContactId("");
        setConditions([{ id: Math.random().toString(36).substr(2, 9), field: 'Description', operator: 'contains', value: '' }]);
        setMatchType('AND');
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSave = async () => {
        if (!ruleName || !ledger || conditions.length === 0) return;

        const ruleData = {
            rule_name: ruleName,
            matchType,
            conditions,
            rule_type: ruleType,
            actions: {
                ledger,
                contactId: contactId || undefined,
            },
            is_active: true
        };

        if (editingId) {
            await editRule(editingId, ruleData);
        } else {
            await addRule({
                client_id: selectedCompany.id,
                ...ruleData
            });
        }
        resetForm();
    };

    const handleImport = async () => {
        if (!importClient || selectedImportRules.length === 0) return;

        const rulesToImport = clientRulesList.filter(r => selectedImportRules.includes(r.id));

        for (const r of rulesToImport) {
            await addRule({
                client_id: selectedCompany.id,
                rule_name: r.rule_name,
                conditions: r.conditions,
                matchType: r.matchType,
                rule_type: r.rule_type,
                actions: r.actions,
                is_active: true
            });
        }

        setIsImportOpen(false);
        setImportClient("");
        setSelectedImportRules([]);
        setClientRulesList([]);
    };

    const startEdit = (rule: Rule) => {
        setRuleName(rule.rule_name);
        setConditions(rule.conditions || []);
        setMatchType(rule.matchType || 'AND');
        setRuleType(rule.rule_type || 'Expense');
        setContactId(rule.actions?.contactId || "");
        setLedger(rule.actions?.ledger || "");
        setEditingId(rule.id);
        setIsAdding(true);
    };

    const availableClients = allClientsList.filter(c => c.id !== selectedCompany.id);

    // Helper to display rule condition summary
    const getConditionSummary = (rule: Rule) => {
        if (!rule.conditions || rule.conditions.length === 0) return "No conditions";
        const first = rule.conditions[0];
        const count = rule.conditions.length;
        const summary = `${first.field} ${first.operator.replace('_', ' ')} "${first.value}"`;
        if (count > 1) {
            return `${summary} +${count - 1} more`;
        }
        return summary;
    };

    // Excel Export Logic
    const handleExcelExport = () => {
        if (currentCompanyRules.length === 0) {
            alert("No rules to export.");
            return;
        }

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

    // Excel Import Logic
    const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: "binary" });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data: any[] = XLSX.utils.sheet_to_json(ws);

            if (data.length === 0) {
                alert("No data found in Excel file.");
                return;
            }

            let importCount = 0;
            for (const row of data) {
                // Parse Conditions
                const conditionsRaw = row["Values"] || "";
                const conditions = conditionsRaw.split(";; ").map((cStr: string) => {
                    const parts = cStr.split("|");
                    if (parts.length === 3) {
                        return { id: Math.random().toString(36).substr(2, 9), field: parts[0], operator: parts[1], value: parts[2] };
                    }
                    return null;
                }).filter((c: any) => c !== null);

                // Find Contact ID if name provided
                let contactId = undefined;
                if (row["Contact Name"]) {
                    const contact = [...customers, ...vendors].find((c: any) => c.DisplayName === row["Contact Name"]);
                    if (contact) contactId = contact.Id;
                }

                await addRule({
                    client_id: selectedCompany.id,
                    rule_name: row["Rule Name"] || `Imported Rule ${Math.random().toString(36).substr(2, 5)}`,
                    rule_type: row["Transaction Type"] || "Expense",
                    matchType: row["Match Type"] || "AND",
                    conditions: conditions.length > 0 ? conditions : [{ id: Math.random().toString(36).substr(2, 9), field: 'Description', operator: 'contains', value: '' }],
                    actions: {
                        ledger: row["Ledger Account"] || "Uncategorized",
                        contactId: contactId
                    },
                    is_active: true
                });
                importCount++;
            }
            alert(`Successfully imported ${importCount} rules.`);
            // Reset input
            e.target.value = "";
        };
        reader.readAsBinaryString(file);
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-col gap-2 py-4">
                <div className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Rules Management</CardTitle>
                    {!isAdding && (
                        <Button size="sm" variant="ghost" onClick={() => setIsAdding(true)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Import/Export Actions */}
                <div className="flex gap-2">
                    <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 text-xs h-7">
                                <Copy className="mr-1 h-3 w-3" /> Import Rules
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Import Rules from Client</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Select Source Client</Label>
                                    <Select value={importClient} onValueChange={setImportClient}>
                                        <SelectTrigger>
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
                                    <div className="space-y-2 border border-white/10 rounded-md p-2 h-[300px] overflow-y-auto bg-black/20">
                                        <div className="flex items-center space-x-2 p-2 border-b border-white/10 mb-2 sticky top-0 bg-black/40 backdrop-blur-md z-10">
                                            <Checkbox
                                                id="select-all"
                                                checked={clientRulesList.length > 0 && clientRulesList.every(r => selectedImportRules.includes(r.id))}
                                                onCheckedChange={(checked: boolean) => {
                                                    if (checked) {
                                                        setSelectedImportRules(clientRulesList.map(r => r.id));
                                                    } else {
                                                        setSelectedImportRules([]);
                                                    }
                                                }}
                                            />
                                            <Label htmlFor="select-all" className="font-semibold text-sm cursor-pointer text-foreground">Select All</Label>
                                        </div>
                                        <Label className="text-xs text-muted-foreground mb-2 block px-2">Available Rules</Label>

                                        {isFetchingClientRules ? (
                                            <div className="flex justify-center py-8">
                                                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                                            </div>
                                        ) : (
                                            <>
                                                {clientRulesList.map(rule => (
                                                    <div key={rule.id} className="flex items-start justify-between space-x-2 p-2 hover:bg-accent rounded group transition-colors">
                                                        <div className="flex items-start space-x-2 flex-1">
                                                            <Checkbox
                                                                id={rule.id}
                                                                checked={selectedImportRules.includes(rule.id)}
                                                                onCheckedChange={(checked: boolean) => {
                                                                    if (checked) setSelectedImportRules([...selectedImportRules, rule.id]);
                                                                    else setSelectedImportRules(selectedImportRules.filter(id => id !== rule.id));
                                                                }}
                                                                className="mt-1"
                                                            />
                                                            <div className="grid gap-1.5 leading-none">
                                                                <label
                                                                    htmlFor={rule.id}
                                                                    className="text-sm font-medium leading-none cursor-pointer text-foreground"
                                                                >
                                                                    {rule.rule_name}
                                                                </label>
                                                                <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                                                                    {getConditionSummary(rule)} → {rule.actions.ledger}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {clientRulesList.length === 0 && (
                                                    <p className="text-center text-xs text-muted-foreground mt-8">No rules found for this client.</p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button onClick={handleImport} disabled={!importClient || selectedImportRules.length === 0} className="glow-primary">Import Selected</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button variant="outline" size="sm" className="flex-1 text-xs h-7 border-border hover:bg-accent hover:text-primary" onClick={() => document.getElementById('rule-import-input')?.click()}>
                        <Upload className="mr-1 h-3 w-3" /> Excel
                    </Button>
                    <input
                        type="file"
                        id="rule-import-input"
                        className="hidden"
                        accept=".xlsx, .xls"
                        onChange={handleExcelImport}
                    />
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-7 border-border hover:bg-accent hover:text-primary" onClick={handleExcelExport}>
                        <Download className="mr-1 h-3 w-3" /> Export
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4">

                {/* Add / Edit Rule Side Drawer */}
                <Sheet open={isAdding} onOpenChange={(open) => { if (!open) resetForm(); else setIsAdding(true); }}>
                    <SheetContent side="right" className="sm:max-w-md w-full bg-card border-l border-border p-6 flex flex-col justify-between overflow-y-auto">
                        <div className="space-y-5">
                            <SheetHeader className="p-0 space-y-1">
                                <SheetTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                                    <SlidersHorizontal className="h-5 w-5 text-primary" />
                                    {editingId ? 'Edit Automation Rule' : 'Create Automation Rule'}
                                </SheetTitle>
                                <SheetDescription className="text-xs text-muted-foreground">
                                    Configure logic to automatically map bank statement transactions to QBO Accounts and Contacts.
                                </SheetDescription>
                            </SheetHeader>

                            <div className="space-y-4 pt-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">Rule Name</Label>
                                    <Input
                                        className="h-9 text-sm bg-background border-input text-foreground font-medium"
                                        value={ruleName}
                                        onChange={e => setRuleName(e.target.value)}
                                        placeholder="e.g. Uber Travel Expenses"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">If (Condition Logic)</Label>
                                    <RuleBuilder
                                        conditions={conditions}
                                        matchType={matchType}
                                        onChange={(newConditions, newType) => {
                                            setConditions(newConditions);
                                            setMatchType(newType);
                                        }}
                                    />
                                </div>

                                <div className="space-y-3 pt-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Then Apply Action</Label>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-foreground">Transaction Type</Label>
                                            <Select value={ruleType} onValueChange={(val: TransactionType) => {
                                                setRuleType(val);
                                                setLedger("");
                                                setContactId("");
                                            }}>
                                                <SelectTrigger className="h-9 text-xs bg-background border-input text-foreground">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TRANSACTION_TYPES.map(t => (
                                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-foreground">
                                                {['Income', 'Credit Note'].includes(ruleType) ? 'Customer (Optional)' :
                                                    ['Transfer', 'Journal Entry'].includes(ruleType) ? 'N/A' :
                                                        'Vendor (Optional)'}
                                            </Label>
                                            {!['Transfer', 'Journal Entry'].includes(ruleType) && (
                                                <SearchableSelect
                                                    value={contactId}
                                                    onValueChange={setContactId}
                                                    options={[
                                                        { value: "none", label: "None (No Contact)" },
                                                        ...((['Income', 'Credit Note'].includes(ruleType) ? customers : vendors).map(c => ({
                                                            value: c.Id,
                                                            label: c.DisplayName || c.CompanyName || c.Id
                                                        })))
                                                    ]}
                                                    placeholder={['Income', 'Credit Note'].includes(ruleType) ? "Search Customer..." : "Search Vendor..."}
                                                    searchPlaceholder="Type to search..."
                                                />
                                            )}
                                            {['Transfer', 'Journal Entry'].includes(ruleType) && (
                                                <div className="h-9 flex items-center text-xs text-muted-foreground italic px-3 border border-border rounded-lg bg-muted/20">
                                                    Not applicable
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-foreground">
                                            {ruleType === 'Transfer' ? 'Transferee Bank Account' :
                                                ruleType === 'Income' ? 'Income Ledger' :
                                                    'Expense Ledger'}
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
                                </div>
                            </div>
                        </div>

                        <SheetFooter className="p-0 pt-6 mt-6 border-t border-border flex flex-row gap-2 justify-end">
                            <Button variant="outline" onClick={resetForm} className="border-border text-foreground">
                                Cancel
                            </Button>
                            <Button className="glow-primary font-semibold flex-1" onClick={() => void handleSave()}>
                                <Save className="h-4 w-4 mr-2" /> Save Rule
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>

                {/* List Rules */}
                <div className="space-y-2.5">
                    {currentCompanyRules.map(rule => (
                        <div
                            key={rule.id}
                            onClick={() => startEdit(rule)}
                            className="group border border-border rounded-xl p-3.5 transition-all duration-200 bg-card hover:bg-accent/50 hover:border-primary/40 shadow-sm hover:shadow-md cursor-pointer relative"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                            {rule.rule_name}
                                        </p>
                                        {rule.rule_type && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                {rule.rule_type}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5 flex-wrap">
                                        <span className={`inline-block text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${rule.matchType === 'OR' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'}`}>
                                            {rule.matchType}
                                        </span>
                                        <span className="font-mono text-xs">{getConditionSummary(rule)}</span>
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 pt-1 border-t border-border/40 text-xs">
                                        <ArrowRight className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                        <span className="font-semibold text-foreground">
                                            {rule.actions.ledger}
                                        </span>
                                        {rule.actions.contactId && (
                                            <span className="text-muted-foreground truncate max-w-[200px]">
                                                • {[...customers, ...vendors].find((c: any) => c.Id === rule.actions.contactId)?.DisplayName || 'Contact Selected'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            void deleteRule(rule.id);
                                        }}
                                        title="Delete Rule"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {currentCompanyRules.length === 0 && !isAdding && (
                        <div className="text-center py-10 px-4 rounded-xl border border-dashed border-border bg-muted/20">
                            <p className="text-sm font-medium text-foreground">No rules created yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Click the "+" button above to add your first automation rule.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
