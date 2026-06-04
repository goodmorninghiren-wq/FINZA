import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, Loader2, Send } from "lucide-react";
import { useState, useRef } from "react";

interface Step4Props {
    onBack: () => void;
    onReset?: () => void;
    data: any[];
    bankAccountId?: string;
}

export function Step4Post({ onBack, onReset, data, bankAccountId }: Step4Props) {
    const [status, setStatus] = useState<'idle' | 'posting' | 'success' | 'error' | 'partial'>('idle');
    const [result, setResult] = useState<{ success: number; errors: number; details: any[] } | null>(null);
    // Double-submit guard — works even across React StrictMode double-mount
    const isSubmitting = useRef(false);

    const postTransactions = async () => {
        // Hard guard: if already submitting, do nothing
        if (isSubmitting.current) return;
        isSubmitting.current = true;
        setStatus('posting'); // This hides the button immediately

        try {
            const res = await fetch('/api/qbo/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transactions: data,
                    bankAccountId: bankAccountId
                })
            });

            const json = await res.json();

            setResult({
                success: json.successCount || 0,
                errors: json.errorCount || 0,
                details: json.errors || []
            });

            if (res.ok) {
                setStatus(json.errorCount > 0 ? 'partial' : 'success');
            } else {
                setStatus('error');
                isSubmitting.current = false; // Allow retry on error
            }
        } catch (e) {
            setStatus('error');
            isSubmitting.current = false; // Allow retry on error
        }
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-6 py-10">

            {/* === IDLE: Confirm before posting === */}
            {status === 'idle' && (
                <>
                    <div className="bg-primary/20 p-6 rounded-full">
                        <Send className="h-16 w-16 text-primary" />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-foreground">Ready to Post</h2>
                        <p className="text-muted-foreground">
                            You are about to post <span className="font-bold text-primary">{data.length} transactions</span> to QuickBooks Online.
                        </p>
                        <p className="text-xs text-muted-foreground">This action will create bank entries in QBO. Please review your data before proceeding.</p>
                    </div>
                    <div className="flex gap-3 w-full max-w-sm">
                        <Button
                            variant="outline"
                            onClick={onBack}
                            className="flex-1 border-white/10 hover:bg-white/5 hover:text-primary"
                        >
                            Back to Review
                        </Button>
                        <Button
                            className="flex-1 glow-primary font-bold"
                            onClick={postTransactions}
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Post to QBO
                        </Button>
                    </div>
                </>
            )}

            {/* === POSTING === */}
            {status === 'posting' && (
                <>
                    <div className="bg-blue-500/20 p-6 rounded-full animate-pulse">
                        <Loader2 className="h-16 w-16 text-blue-400 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Posting to QuickBooks...</h2>
                    <p className="text-muted-foreground">Processing {data.length} entries. Please wait...</p>
                </>
            )}

            {/* === SUCCESS === */}
            {status === 'success' && (
                <>
                    <div className="bg-green-500/20 p-6 rounded-full glow-green">
                        <CheckCircle className="h-16 w-16 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Posting Complete!</h2>
                    {result && (
                        <p className="text-green-500 font-medium">Successfully posted {result.success} transactions.</p>
                    )}
                </>
            )}

            {/* === PARTIAL / ERROR === */}
            {(status === 'partial' || status === 'error') && (
                <>
                    <div className={`p-6 rounded-full ${status === 'partial' ? 'bg-yellow-500/20 glow-yellow' : 'bg-red-500/20 glow-red'}`}>
                        <AlertTriangle className={`h-16 w-16 ${status === 'partial' ? 'text-yellow-500' : 'text-red-500'}`} />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                        {status === 'partial' ? 'Posting Completed with Issues' : 'Posting Failed'}
                    </h2>
                    {status === 'partial' && result && (
                        <div className="text-center text-sm space-y-1">
                            <p className="text-green-500">Success: {result.success}</p>
                            <p className="text-red-500">Failed: {result.errors}</p>
                            {result.details.length > 0 && (
                                <div className="mt-2 max-h-[150px] overflow-y-auto text-left bg-white/5 p-2 rounded text-xs text-red-400 border border-red-500/20">
                                    {result.details.map((err: any, i: number) => (
                                        <div key={i} className="mb-1">
                                            • {err.error} <span className="text-muted-foreground">({err.txn?.Description})</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {status === 'error' && (
                        <p className="text-muted-foreground">Please check your connection or data and try again.</p>
                    )}
                </>
            )}

            {/* Back / Post More button (shown after completion) */}
            {(status === 'success' || status === 'partial' || status === 'error') && (
                <Button
                    variant="outline"
                    onClick={status === 'success' ? (onReset || onBack) : onBack}
                    className="border-white/10 hover:bg-white/5 hover:text-primary"
                >
                    {status === 'success' ? "Post More" : "Back"}
                </Button>
            )}
        </div>
    );
}
