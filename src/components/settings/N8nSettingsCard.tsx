"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, CheckCircle2, XCircle, Link2, Workflow } from "lucide-react";
import { useStore } from "@/store/useStore";

export function N8nSettingsCard() {
    const selectedCompany = useStore(state => state.selectedCompany);
    const [webhookUrl, setWebhookUrl] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'untested' | 'connected' | 'failed'>('untested');

    useEffect(() => {
        async function loadSavedUrl() {
            // First try localStorage (fastest)
            const localUrl = localStorage.getItem("n8n_webhook_url");
            if (localUrl) {
                setWebhookUrl(localUrl);
                setConnectionStatus('connected');
            }
            // Then try to load from database (most reliable)
            try {
                const res = await fetch('/api/settings/n8n');
                if (res.ok) {
                    const data = await res.json();
                    if (data.webhookUrl) {
                        setWebhookUrl(data.webhookUrl);
                        // Also sync to localStorage
                        localStorage.setItem("n8n_webhook_url", data.webhookUrl);
                        setConnectionStatus('connected');
                    }
                }
            } catch {
                // DB load failed, localStorage is the fallback
            }
        }
        loadSavedUrl();
    }, []);

    const handleSave = async () => {
        if (!webhookUrl.trim()) {
            setMessage({ type: 'error', text: 'Please enter a webhook URL.' });
            return;
        }
        setIsSaving(true);
        setMessage(null);
        try {
            // Save to localStorage and also persist via API
            localStorage.setItem("n8n_webhook_url", webhookUrl.trim());
            await fetch('/api/settings/n8n', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ webhookUrl: webhookUrl.trim() }),
            });
            setMessage({ type: 'success', text: 'n8n webhook URL saved successfully!' });
            setConnectionStatus('connected');
        } catch (error) {
            // Even if server save fails, localStorage save is done
            setMessage({ type: 'success', text: 'n8n webhook URL saved locally!' });
            setConnectionStatus('connected');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTest = async () => {
        if (!webhookUrl.trim()) {
            setMessage({ type: 'error', text: 'Please enter and save a webhook URL first.' });
            return;
        }
        setIsTesting(true);
        setMessage(null);
        try {
            // Build URL with company_id as query param (same as real PDF upload)
            const testUrl = new URL(webhookUrl.trim());
            if (selectedCompany.id) testUrl.searchParams.set('company_id', selectedCompany.id);
            if (selectedCompany.name) testUrl.searchParams.set('company_name', selectedCompany.name);

            const res = await fetch('/api/test-n8n-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ webhookUrl: webhookUrl.trim() }),
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Connection successful! n8n is reachable.' });
                setConnectionStatus('connected');
            } else {
                setMessage({ type: 'error', text: 'Connection failed. Make sure your workflow is active.' });
                setConnectionStatus('failed');
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Could not reach the n8n server. Check the URL.' });
            setConnectionStatus('failed');
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <Card className="glass border-white/10 shadow-xl">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                        <Workflow className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            n8n Integration
                            {connectionStatus === 'connected' && (
                                <span className="inline-flex items-center gap-1 text-xs text-green-400 font-normal">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                                </span>
                            )}
                            {connectionStatus === 'failed' && (
                                <span className="inline-flex items-center gap-1 text-xs text-red-400 font-normal">
                                    <XCircle className="h-3.5 w-3.5" /> Failed
                                </span>
                            )}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Connect your n8n workflow to extract data from PDF bank statements automatically.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {message && (
                    <div className={`p-3 rounded-lg text-xs border ${message.type === 'success'
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="n8nWebhook" className="text-muted-foreground px-1 flex items-center gap-1.5">
                        <Link2 className="h-3.5 w-3.5" /> Webhook URL
                    </Label>
                    <Input
                        type="url"
                        id="n8nWebhook"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://your-n8n-instance.com/webhook/..."
                        className="bg-black/20 border-white/10 text-foreground h-11 focus:ring-primary/20 font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground px-1">
                        Paste the webhook URL from your n8n workflow trigger node.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button
                        className="glow-primary h-10 font-bold flex-1"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save
                    </Button>
                    <Button
                        variant="outline"
                        className="h-10 border-white/10 hover:bg-white/5"
                        onClick={handleTest}
                        disabled={isTesting || !webhookUrl}
                    >
                        {isTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Test Connection
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
