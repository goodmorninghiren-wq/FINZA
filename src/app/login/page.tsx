"use client";

export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogIn, UserPlus, Mail, Lock, Loader2, Building2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

function LoginForm() {
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(defaultTab);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password,
                }),
            });

            const raw = await res.text();
            let data: { error?: string; hint?: string } = {};
            if (raw.trim()) {
                try {
                    data = JSON.parse(raw);
                } catch {
                    setError(
                        'Login returned an invalid response. Restart with: npm run dev'
                    );
                    return;
                }
            } else if (!res.ok) {
                setError(
                    res.status === 401
                        ? 'Invalid email or password.'
                        : `Login failed (HTTP ${res.status}). Restart with: npm run dev`
                );
                return;
            }

            if (!res.ok) {
                const msg = [data.error, data.hint].filter(Boolean).join(' ');
                setError(
                    msg ||
                        (res.status === 401
                            ? 'Invalid email or password.'
                            : 'Login failed. See console for details.')
                );
                return;
            }

            window.location.assign('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            const msg = err instanceof Error ? err.message : '';
            setError(
                msg === 'Failed to fetch'
                    ? 'Cannot reach the app login API. Is the dev server running on http://localhost:3000?'
                    : msg.toLowerCase().includes('json')
                      ? 'Login response was empty or invalid. Run: npm run dev'
                      : msg || 'Login failed. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                if (res.status === 409) {
                    setError("This account already exists! Please use the Login tab.");
                } else {
                    setError(data.error || 'Sign up failed.');
                }
                return;
            }

            if (data.session) {
                window.location.assign('/dashboard');
                return;
            }

            setError(
                data.message ||
                    "Success! Check your email to confirm, or ask an admin to disable email confirmation in Supabase."
            );
        } catch (err: unknown) {
            console.error('SignUp error:', err);
            setError(
                err instanceof Error ? err.message : 'An unexpected error occurred during sign up.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC]">
            <div className="w-full max-w-md">
                <div className="mb-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-[#1E40AF]"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden />
                        Back to Home
                    </Link>
                </div>

                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E40AF] to-[#6366F1] shadow-lg shadow-blue-500/25">
                        <Building2 className="h-7 w-7 text-white" aria-hidden />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Finza</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        QuickBooks bank entry automation for accounting firms
                    </p>
                </div>

                <Card className="border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <CardHeader className="pb-4">
                            <TabsList className="grid h-12 w-full grid-cols-2 rounded-xl bg-slate-100 p-1">
                                <TabsTrigger
                                    value="login"
                                    className="rounded-lg text-sm font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-[#1E40AF] data-[state=active]:shadow-sm"
                                >
                                    <LogIn className="mr-2 h-4 w-4" aria-hidden />
                                    Sign In
                                </TabsTrigger>
                                <TabsTrigger
                                    value="signup"
                                    className="rounded-lg text-sm font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-[#1E40AF] data-[state=active]:shadow-sm"
                                >
                                    <UserPlus className="mr-2 h-4 w-4" aria-hidden />
                                    Create Account
                                </TabsTrigger>
                            </TabsList>
                            <p className="pt-3 text-center text-xs text-slate-500">
                                {activeTab === 'login'
                                    ? 'Sign in with your firm email and password.'
                                    : 'Register a new account for your firm.'}
                            </p>
                        </CardHeader>

                        <CardContent className="px-6">
                            {error && (
                                <div
                                    role="alert"
                                    className={`mb-4 flex items-start gap-2 rounded-xl p-3 text-xs font-medium ${
                                        error.includes('Success')
                                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                                            : 'border border-red-200 bg-red-50 text-red-800'
                                    }`}
                                >
                                    <span className="mt-0.5">{error.includes('Success') ? '✓' : '⚠'}</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            <TabsContent value="login" className="mt-0">
                                <form onSubmit={handleLogin} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                                            Email
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" aria-hidden />
                                            <Input
                                                id="email"
                                                type="email"
                                                autoComplete="username"
                                                placeholder="admin@firm.com"
                                                className="h-12 rounded-xl border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1E40AF]/30"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                                            Password
                                        </Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" aria-hidden />
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                autoComplete="current-password"
                                                className="h-12 rounded-xl border-slate-200 bg-white pl-10 pr-11 text-slate-900 focus-visible:ring-[#1E40AF]/30"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-3.5 text-slate-400 transition-colors hover:text-slate-600"
                                                tabIndex={-1}
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="h-12 w-full rounded-xl bg-[#1E40AF] font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-[#1e3a8a]"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <LogIn className="mr-2 h-4 w-4" aria-hidden />
                                                Sign In
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="signup" className="mt-0">
                                <form onSubmit={handleSignUp} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="signup-email" className="text-sm font-medium text-slate-700">
                                            Email Address
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" aria-hidden />
                                            <Input
                                                id="signup-email"
                                                type="email"
                                                autoComplete="email"
                                                placeholder="name@firm.com"
                                                className="h-12 rounded-xl border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1E40AF]/30"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="signup-password" className="text-sm font-medium text-slate-700">
                                            Password
                                        </Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" aria-hidden />
                                            <Input
                                                id="signup-password"
                                                type={showPassword ? "text" : "password"}
                                                autoComplete="new-password"
                                                placeholder="Create a secure password"
                                                className="h-12 rounded-xl border-slate-200 bg-white pl-10 pr-11 text-slate-900 focus-visible:ring-[#1E40AF]/30"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-3.5 text-slate-400 transition-colors hover:text-slate-600"
                                                tabIndex={-1}
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                                        <p className="text-xs leading-relaxed text-[#1E40AF]">
                                            The first person to register on this instance is granted full administrative access.
                                        </p>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="h-12 w-full rounded-xl bg-[#6366F1] font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-[#4f46e5]"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <UserPlus className="mr-2 h-4 w-4" aria-hidden />
                                                Create Account
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>
                        </CardContent>

                        <CardFooter className="px-6 pb-6 pt-0">
                            <p className="w-full text-center text-xs text-slate-400">
                                By continuing, you agree to our Terms of Service and Privacy Policy.
                            </p>
                        </CardFooter>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="h-8 w-8 animate-spin text-[#1E40AF]" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
