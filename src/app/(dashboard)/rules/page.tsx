"use client";

import { useState, useEffect, useCallback } from "react";
import { useStore } from "@/store/useStore";
import { RulesPanel } from "@/components/bank-entries/RulesPanel";
import { CloudDownload, CloudUpload, CheckCircle2, XCircle, AlertTriangle, Clock, SlidersHorizontal, BarChart3 } from "lucide-react";

interface SyncLogEntry {
    id: string;
    company_id: string;
    direction: 'import' | 'export';
    rules_count: number;
    status: 'success' | 'error' | 'partial';
    error_message?: string;
    synced_at: string;
}

export default function RulesPage() {
    const { selectedCompany, connectedCompanies } = useStore();
    const [activeTab, setActiveTab] = useState<'rules' | 'sync-log'>('rules');
    const [syncLog, setSyncLog] = useState<SyncLogEntry[]>([]);
    const [isLoadingLog, setIsLoadingLog] = useState(false);

    const activeCompanyId = selectedCompany?.id || connectedCompanies?.[0]?.id;

    const fetchSyncLog = useCallback(async () => {
        if (!activeCompanyId) return;
        setIsLoadingLog(true);
        try {
            const res = await fetch(`/api/rules/sync-log?companyId=${activeCompanyId}`);
            if (res.ok) setSyncLog(await res.json() || []);
        } catch { /* ignore */ }
        finally { setIsLoadingLog(false); }
    }, [activeCompanyId]);

    useEffect(() => {
        if (activeTab === 'sync-log') fetchSyncLog();
    }, [activeTab, fetchSyncLog]);

    const statusIcon = (status: string) => {
        if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
        if (status === 'error') return <XCircle className="h-4 w-4 text-destructive" />;
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    };

    const statusLabel = (status: string) => {
        if (status === 'success') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
        if (status === 'error') return 'bg-destructive/10 text-destructive border-destructive/20';
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    };

    return (
        <div className="space-y-2.5 h-[calc(100vh-68px)] flex flex-col overflow-hidden">
            {/* Page Header — Compact */}
            <div className="flex justify-between items-center flex-shrink-0 pt-1">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-foreground gradient-text leading-none">Rules Engine</h1>
                    <span className="text-xs text-muted-foreground hidden sm:inline border-l border-border pl-3">
                        Automate bank transaction mapping to QuickBooks Online accounts
                    </span>
                </div>
                {selectedCompany?.name && (
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        {selectedCompany.name}
                    </div>
                )}
            </div>

            {/* Tab Bar — Compact */}
            <div className="flex items-center gap-1 border-b border-border flex-shrink-0">
                {[
                    { id: 'rules', label: 'Automation Rules', icon: SlidersHorizontal },
                    { id: 'sync-log', label: 'QBO Sync Log', icon: BarChart3 },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'rules' | 'sync-log')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium transition-all border-b-2 -mb-px ${activeTab === tab.id
                            ? 'border-primary text-primary font-semibold'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                            }`}
                    >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                        {tab.id === 'sync-log' && syncLog.length > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20">
                                {syncLog.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content — Maximize Height */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {activeTab === 'rules' && (
                    <RulesPanel />
                )}

                {activeTab === 'sync-log' && (
                    <div className="space-y-3">
                        {isLoadingLog ? (
                            <div className="flex justify-center py-16">
                                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                            </div>
                        ) : syncLog.length === 0 ? (
                            <div className="text-center py-16 px-4 rounded-xl border border-dashed border-border bg-muted/10">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                                    <Clock className="h-6 w-6 text-primary" />
                                </div>
                                <p className="text-sm font-semibold text-foreground">No sync history yet</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Use the &quot;Pull from QBO&quot; or &quot;Push to QBO&quot; buttons to sync rules.
                                </p>
                            </div>
                        ) : (
                            <>
                                <p className="text-xs text-muted-foreground">Showing last {syncLog.length} sync events</p>
                                {syncLog.map(entry => (
                                    <div key={entry.id} className="rounded-xl border border-border bg-card p-4 flex items-start gap-4">
                                        {/* Icon */}
                                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${entry.direction === 'import' ? 'bg-primary/10' : 'bg-emerald-500/10'}`}>
                                            {entry.direction === 'import'
                                                ? <CloudDownload className="h-4 w-4 text-primary" />
                                                : <CloudUpload className="h-4 w-4 text-emerald-500" />
                                            }
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-semibold text-foreground">
                                                    {entry.direction === 'import' ? 'Pulled from QBO' : 'Pushed to QBO'}
                                                </p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusLabel(entry.status)}`}>
                                                    {entry.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {entry.rules_count} rule{entry.rules_count !== 1 ? 's' : ''} {entry.direction === 'import' ? 'imported' : 'exported'}
                                            </p>
                                            {entry.error_message && (
                                                <p className="text-xs text-destructive mt-1 font-mono">{entry.error_message}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {statusIcon(entry.status)}
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(entry.synced_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
