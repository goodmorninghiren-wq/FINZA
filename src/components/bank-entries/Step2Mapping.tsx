/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight } from "lucide-react";
import { useStore } from "@/store/useStore";

interface Step2Props {
    onNext: () => void;
    onBack: () => void;
    data: any[];
    setData: (data: any[]) => void;
}

// ── Smart Rule Mapping Resolver ────────────────────────────────────────────────
function resolveRuleMapping(row: any, accList: any[], venList: any[], cusList: any[]) {
    let updatedRow = { ...row };

    // 1. Transaction Type
    if (row.suggested_type) {
        updatedRow.transaction_type = row.suggested_type;
    }

    const type = updatedRow.transaction_type || 'Expense';
    const isIncome = ["Income", "Credit Note"].includes(type);

    // 2. Account / Ledger Resolution
    if (row.suggested_ledger) {
        const suggested = row.suggested_ledger.toString().trim().toLowerCase();

        // Exact match by Name or ID
        let acc = accList.find((a: any) =>
            a.Name?.toString().trim().toLowerCase() === suggested ||
            a.Id?.toString() === suggested
        );

        // Partial match
        if (!acc) {
            acc = accList.find((a: any) => {
                const name = a.Name?.toString().trim().toLowerCase() || "";
                return name.includes(suggested) || suggested.includes(name);
            });
        }

        // Keyword fallback matching (e.g., 'software', 'travel', 'meals', 'office', 'sales', 'rent')
        if (!acc) {
            const keywords = suggested.split(/[\s&/_-]+/);
            acc = accList.find((a: any) => {
                const name = a.Name?.toString().trim().toLowerCase() || "";
                return keywords.some((kw: string) => kw.length > 3 && name.includes(kw));
            });
        }

        if (acc) {
            updatedRow.qbo_account_id = acc.Id;
        } else {
            // Set suggested string directly so fallback option auto-selects it
            updatedRow.qbo_account_id = row.suggested_ledger;
        }
    }

    // 3. Contact / Payee Resolution
    if (row.suggested_contact_id) {
        const contactVal = row.suggested_contact_id.toString().trim().toLowerCase();
        const contactList = isIncome ? cusList : venList;

        // ID, DisplayName or CompanyName match
        let contact = contactList.find((c: any) =>
            c.Id?.toString() === contactVal ||
            c.DisplayName?.toString().trim().toLowerCase() === contactVal ||
            c.CompanyName?.toString().trim().toLowerCase() === contactVal
        );

        // Partial match
        if (!contact) {
            contact = contactList.find((c: any) => {
                const name = c.DisplayName?.toString().trim().toLowerCase() || "";
                return name.includes(contactVal) || contactVal.includes(name);
            });
        }

        if (contact) {
            if (isIncome) updatedRow.qbo_customer_id = contact.Id;
            else updatedRow.qbo_vendor_id = contact.Id;
        } else {
            // Set suggested contact string directly so fallback option auto-selects it
            if (isIncome) updatedRow.qbo_customer_id = row.suggested_contact_id;
            else updatedRow.qbo_vendor_id = row.suggested_contact_id;
        }
    }

    return updatedRow;
}

export function Step2Mapping({ onNext, onBack, data, setData }: Step2Props) {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { selectedCompany } = useStore();
    const [isApplyingRules, setIsApplyingRules] = useState(false);
    const hasAppliedRules = useRef(false);

    const applyRules = async (currentData: any[]) => {
        setIsApplyingRules(true);
        try {
            const res = await fetch('/api/rules/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId: selectedCompany.id, transactions: currentData })
            });
            if (res.ok) {
                const { transactions: mappedData, applied } = await res.json();
                if (applied) {
                    const finalData = mappedData.map((row: any) =>
                        resolveRuleMapping(row, accounts, vendors, customers)
                    );
                    setData(finalData);
                }
            }
        } catch (error) {
            console.error("Failed to apply rules", error);
        } finally {
            setIsApplyingRules(false);
        }
    };

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [accRes, venRes, cusRes] = await Promise.all([
                    fetch(`/api/qbo/accounts?companyId=${selectedCompany.id}`),
                    fetch(`/api/qbo/vendors?companyId=${selectedCompany.id}`),
                    fetch(`/api/qbo/customers?companyId=${selectedCompany.id}`)
                ]);

                const accData = await accRes.json();
                const venData = await venRes.json();
                const cusData = await cusRes.json();

                setAccounts(accData || []);
                setVendors(venData || []);
                setCustomers(cusData || []);
            } catch (error) {
                console.error("Failed to fetch QBO master data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [selectedCompany.id]);

    // Rule Application on Load
    useEffect(() => {
        const initAndApply = async () => {
            if (!isLoading && data.length > 0 && !hasAppliedRules.current) {
                hasAppliedRules.current = true;

                // Prepare data if missing transaction_type
                const initializedData = data.map(row => {
                    if (!row.hasOwnProperty('transaction_type')) {
                        const amountVal = parseFloat(row.Amount || row.amount || "0");
                        return {
                            ...row,
                            transaction_type: amountVal > 0 ? 'Income' : 'Expense',
                            qbo_account_id: row.qbo_account_id || "",
                            rule_applied: row.rule_applied || ""
                        };
                    }
                    return row;
                });

                // Apply rules
                try {
                    const res = await fetch('/api/rules/apply', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ companyId: selectedCompany.id, transactions: initializedData })
                    });

                    if (res.ok) {
                        const { transactions: mappedData } = await res.json();
                        const finalData = mappedData.map((row: any) =>
                            resolveRuleMapping(row, accounts, vendors, customers)
                        );
                        setData(finalData);
                    } else {
                        setData(initializedData);
                    }
                } catch (e) {
                    console.error("Failed to apply rules on init", e);
                    setData(initializedData);
                }
            }
        };

        initAndApply();
    }, [isLoading, data, accounts, vendors, customers, selectedCompany.id, setData]);

    const updateRow = (index: number, field: string, value: string | number) => {
        const newData = [...data];
        newData[index] = { ...newData[index], [field]: value };
        setData(newData);
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Step 2: Review & Map Transactions</h2>
            <div className="flex justify-between items-center bg-primary/10 p-4 rounded-xl text-primary border border-primary/20">
                <span className="text-sm font-medium">Found {data.length} transactions. Map them to QBO Accounts, Vendors, or Customers.</span>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void applyRules(data)}
                    disabled={isApplyingRules}
                    className="border-primary/30 hover:bg-primary/20 text-primary font-semibold"
                >
                    {isApplyingRules ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
                    Re-Apply Rules
                </Button>
            </div>

            <div className="border rounded-xl overflow-hidden border-border shadow-sm bg-card">
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/40 sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                                <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</th>
                                <th className="px-5 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
                                <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider w-[150px]">Type</th>
                                <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider w-[220px]">Account (Ledger)</th>
                                <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider w-[220px]">Contact / Payee</th>
                                <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Rule Matched</th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-border/60">
                            {data.map((row, i) => {
                                const type = row.transaction_type || 'Expense';
                                const isTransfer = type === 'Transfer';
                                const isJournal = type === 'Journal Entry';
                                const isIncome = type === 'Income' || type === 'Credit Note';

                                const ledgerOptions = isTransfer
                                    ? accounts.filter((a: any) => a.AccountType === 'Bank' || a.AccountType === 'Credit Card')
                                    : isJournal
                                        ? accounts
                                        : isIncome
                                            ? accounts.filter((a: any) => a.Classification === 'Revenue' || a.AccountType === 'Income' || a.AccountType === 'Other Income')
                                            : accounts.filter((a: any) => a.Classification === 'Expense' || a.AccountType === 'Expense' || a.AccountType === 'Cost of Goods Sold');

                                const selectedContactId = isIncome ? (row.qbo_customer_id || "") : (row.qbo_vendor_id || "");
                                const contactList = isIncome ? customers : vendors;
                                const contactExists = contactList.some((c: any) => c.Id?.toString() === selectedContactId?.toString());
                                const accountExists = accounts.some((a: any) => a.Id?.toString() === row.qbo_account_id?.toString());

                                return (
                                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-5 py-2.5 whitespace-nowrap text-sm text-foreground font-mono">
                                            {row['Date'] || row['date']}
                                        </td>
                                        <td className="px-5 py-2.5 whitespace-nowrap text-sm text-foreground">
                                            <Input
                                                value={row['Description'] || row['description'] || ""}
                                                onChange={(e) => updateRow(i, row.Description ? 'Description' : 'description', e.target.value)}
                                                className="h-8 w-full min-w-[200px] bg-background border-input text-foreground text-xs"
                                            />
                                        </td>
                                        <td className="px-5 py-2.5 whitespace-nowrap text-sm text-foreground text-right font-mono font-semibold">
                                            {row['Amount'] || row['amount']}
                                        </td>
                                        <td className="px-5 py-2.5 whitespace-nowrap">
                                            <select
                                                className="h-8 w-full border border-input rounded-lg text-xs p-1 bg-background text-foreground font-medium focus:ring-primary/20"
                                                value={row.transaction_type || 'Expense'}
                                                onChange={(e) => updateRow(i, 'transaction_type', e.target.value)}
                                            >
                                                <option value="Expense">Expense</option>
                                                <option value="Income">Income</option>
                                                <option value="Transfer">Transfer</option>
                                                <option value="Check">Check</option>
                                                <option value="Bill">Bill</option>
                                                <option value="Purchase">Purchase</option>
                                                <option value="Credit Card Credit">Credit Card Credit</option>
                                                <option value="Credit Note">Credit Note</option>
                                                <option value="Journal Entry">Journal Entry</option>
                                            </select>
                                        </td>
                                        <td className="px-5 py-2.5 whitespace-nowrap">
                                            <select
                                                className="h-8 w-full border border-input rounded-lg text-xs p-1 bg-background text-foreground font-medium focus:ring-primary/20"
                                                value={row.qbo_account_id || ""}
                                                onChange={(e) => updateRow(i, 'qbo_account_id', e.target.value)}
                                            >
                                                <option value="">
                                                    {isTransfer ? 'Select Target Bank' : 'Select Account'}
                                                </option>

                                                {/* Fallback Option for Rule Suggested Ledger */}
                                                {row.qbo_account_id && !accountExists && (
                                                    <option value={row.qbo_account_id}>
                                                        ✨ {row.suggested_ledger || row.qbo_account_id}
                                                    </option>
                                                )}

                                                {ledgerOptions.map(acc => (
                                                    <option key={acc.Id} value={acc.Id}>{acc.Name}</option>
                                                ))}
                                                {ledgerOptions.length === 0 && !row.qbo_account_id && (
                                                    <option disabled>No matching accounts found</option>
                                                )}
                                            </select>
                                        </td>
                                        <td className="px-5 py-2.5 whitespace-nowrap">
                                            {(!isTransfer && !isJournal) ? (
                                                <select
                                                    className="h-8 w-full border border-input rounded-lg text-xs p-1 bg-background text-foreground font-medium focus:ring-primary/20"
                                                    value={selectedContactId}
                                                    onChange={(e) => updateRow(i, isIncome ? 'qbo_customer_id' : 'qbo_vendor_id', e.target.value)}
                                                >
                                                    <option value="">{isIncome ? 'Select Customer' : 'Select Vendor'}</option>

                                                    {/* Fallback Option for Rule Suggested Contact */}
                                                    {selectedContactId && !contactExists && (
                                                        <option value={selectedContactId}>
                                                            ✨ {row.suggested_contact_id || selectedContactId}
                                                        </option>
                                                    )}

                                                    {contactList.map(c => (
                                                        <option key={c.Id} value={c.Id}>{c.DisplayName}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">N/A for {type}</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-2.5 whitespace-nowrap">
                                            {row.rule_applied ? (
                                                <Badge variant="outline" className="bg-primary/10 text-primary font-semibold border-primary/20 text-xs px-2.5 py-0.5">
                                                    {row.rule_applied}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-muted text-muted-foreground font-normal border-border text-xs px-2 py-0.5">
                                                    Manual
                                                </Badge>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-between items-center pt-2">
                <Button variant="outline" onClick={onBack} className="border-border hover:bg-accent text-foreground">Back</Button>
                <div className="space-x-2">
                    <Button onClick={onNext} className="glow-primary font-semibold">
                        Validate & Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
