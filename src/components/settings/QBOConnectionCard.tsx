"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Key, Building, CheckCircle2, Database } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { QboSettingsPayload } from "@/types/qbo-settings";

export function QBOConnectionCard() {
    const [clientId, setClientId] = useState("");
    const [clientSecret, setClientSecret] = useState("");
    const [environment, setEnvironment] = useState("sandbox");
    const [source, setSource] = useState<QboSettingsPayload["source"]>(null);
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const applySettings = useCallback((data: QboSettingsPayload) => {
        setClientId(data.client_id || "");
        setClientSecret(data.client_secret || "");
        setEnvironment(data.environment || "sandbox");
        setSource(data.source);
        setUpdatedAt(data.updated_at ?? null);
    }, []);

    const loadSettings = useCallback(async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            const res = await fetch("/api/settings/qbo", { cache: "no-store" });
            if (res.status === 401) {
                setMessage({
                    type: "error",
                    text: "Sign in to load saved QuickBooks credentials.",
                });
                return;
            }
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setMessage({
                    type: "error",
                    text: err.error || "Could not load QuickBooks settings.",
                });
                return;
            }
            const data = (await res.json()) as QboSettingsPayload;
            applySettings(data);
        } catch (error) {
            console.error("Failed to load QBO settings", error);
            setMessage({
                type: "error",
                text: "Could not load QuickBooks settings. Check your connection.",
            });
        } finally {
            setIsLoading(false);
        }
    }, [applySettings]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleSave = async () => {
        if (!clientId.trim() || !clientSecret.trim()) {
            setMessage({ type: 'error', text: 'Please enter both Client ID and Client Secret.' });
            return;
        }

        setIsSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/settings/qbo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: clientId.trim(),
                    client_secret: clientSecret.trim(),
                    environment,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(
                    data.hint
                        ? `${data.error || "Failed to save"} — ${data.hint}`
                        : data.error || "Failed to save settings"
                );
            }

            applySettings(data as QboSettingsPayload);
            setMessage({ type: 'success', text: 'QuickBooks credentials saved to your account.' });
        } catch (error) {
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to save QBO settings.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const hasCredentials = Boolean(clientId.trim() && clientSecret.trim());

    return (
        <Card className="glass border-white/10 shadow-xl">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                        <Building className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                        <CardTitle className="text-foreground flex items-center gap-2 flex-wrap">
                            QuickBooks Developer Setup
                            {!isLoading && source === "database" && hasCredentials && (
                                <span className="inline-flex items-center gap-1 text-xs text-green-400 font-normal">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Loaded from database
                                </span>
                            )}
                            {!isLoading && source === "environment" && hasCredentials && (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-400/90 font-normal">
                                    <Database className="h-3.5 w-3.5" />
                                    From .env — save to store in database
                                </span>
                            )}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Configure your custom Intuit Developer app credentials.
                            {updatedAt && source === "database" && (
                                <span className="block text-xs mt-0.5 opacity-80">
                                    Last saved {new Date(updatedAt).toLocaleString()}
                                </span>
                            )}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {message && (
                            <div className={`p-3 rounded-lg text-xs border ${message.type === 'success'
                                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="qboClientId" className="text-muted-foreground px-1 flex items-center gap-1.5">
                                <Key className="h-3.5 w-3.5" /> Client ID
                            </Label>
                            <Input
                                type="text"
                                id="qboClientId"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                placeholder="ABKPY..."
                                autoComplete="off"
                                className="bg-black/20 border-white/10 text-foreground h-11 focus:ring-primary/20 font-mono text-sm"
                            />
                        </div>

                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="qboClientSecret" className="text-muted-foreground px-1 flex items-center gap-1.5">
                                <Key className="h-3.5 w-3.5" /> Client Secret
                            </Label>
                            <Input
                                type="password"
                                id="qboClientSecret"
                                value={clientSecret}
                                onChange={(e) => setClientSecret(e.target.value)}
                                placeholder="••••••••••••"
                                autoComplete="off"
                                className="bg-black/20 border-white/10 text-foreground h-11 focus:ring-primary/20 font-mono text-sm"
                            />
                        </div>

                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="qboEnvironment" className="text-muted-foreground px-1">
                                Environment
                            </Label>
                            <Select value={environment} onValueChange={setEnvironment}>
                                <SelectTrigger className="bg-black/20 border-white/10 text-foreground h-11">
                                    <SelectValue placeholder="Select Environment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sandbox">Sandbox</SelectItem>
                                    <SelectItem value="production">Production</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground px-1 mt-1">
                                Make sure your Intuit app Redirect URI matches your deployment, e.g.{" "}
                                <span className="font-mono text-primary/70">
                                    {typeof window !== "undefined"
                                        ? `${window.location.origin}/api/auth/qbo/callback`
                                        : "http://localhost:3000/api/auth/qbo/callback"}
                                </span>
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                className="glow-primary h-10 font-bold flex-1"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Save Credentials
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
