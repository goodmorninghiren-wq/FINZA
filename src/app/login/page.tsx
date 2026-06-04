"use client";

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogIn, UserPlus, Mail, Lock, Loader2, Building2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


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

            window.location.assign('/');
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
                window.location.assign('/');
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#050510] relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[130px] animate-pulse" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-violet-600/15 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute top-[40%] right-[20%] w-[20%] h-[20%] bg-blue-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '4s' }} />

            <div className="w-full max-w-md relative animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-600 shadow-2xl shadow-indigo-500/30 mb-4 animate-pulse-glow">
                        <Building2 className="h-9 w-9 text-white drop-shadow" />
                    </div>
                    <h1 className="text-4xl font-extrabold gradient-text tracking-tight">Finza</h1>
                    <p className="text-muted-foreground/70 text-xs mt-1.5 uppercase tracking-[0.25em] font-semibold">Accounting Intelligence</p>
                </div>

                <Card className="border border-white/10 shadow-2xl" style={{ background: 'rgba(15,15,30,0.85)', backdropFilter: 'blur(20px)' }}>
                    <Tabs defaultValue="login" className="w-full">
                        <CardHeader className="pb-2">
                            <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 rounded-xl p-1">
                                <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-semibold">Login</TabsTrigger>
                                <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-semibold">Sign Up</TabsTrigger>
                            </TabsList>
                        </CardHeader>

                        <CardContent className="px-6">
                            {error && (
                                <div className={`p-3 rounded-xl text-xs font-medium mb-4 animate-in slide-in-from-top-2 flex items-start gap-2 ${
                                    error.includes('Success')
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                    <span className="mt-0.5">{error.includes('Success') ? '✓' : '⚠'}</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            <TabsContent value="login">
                                <form onSubmit={handleLogin} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-sm text-white/70 font-medium">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-white/30" />
                                            <Input
                                                id="email"
                                                type="email"
                                                autoComplete="username"
                                                placeholder="admin@firm.com"
                                                className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-indigo-500/60 focus:ring-indigo-500/20 rounded-xl transition-all"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="password" className="text-sm text-white/70 font-medium">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-white/30" />
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                autoComplete="current-password"
                                                className="pl-10 pr-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-indigo-500/60 focus:ring-indigo-500/20 rounded-xl transition-all"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-3.5 text-white/30 hover:text-white/70 transition-colors"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="mr-2 h-4 w-4" /> Sign In</>}
                                    </Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="signup">
                                <form onSubmit={handleSignUp} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="signup-email" className="text-sm text-white/70 font-medium">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-white/30" />
                                            <Input
                                                id="signup-email"
                                                type="email"
                                                autoComplete="email"
                                                placeholder="name@example.com"
                                                className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-indigo-500/60 focus:ring-indigo-500/20 rounded-xl transition-all"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="signup-password" className="text-sm text-white/70 font-medium">Create Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-white/30" />
                                            <Input
                                                id="signup-password"
                                                type={showPassword ? "text" : "password"}
                                                autoComplete="new-password"
                                                placeholder="••••••••"
                                                className="pl-10 pr-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-indigo-500/60 focus:ring-indigo-500/20 rounded-xl transition-all"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-3.5 text-white/30 hover:text-white/70 transition-colors"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                        <p className="text-[10px] text-indigo-300/70 leading-relaxed uppercase tracking-wider font-bold italic">
                                            Note: The first person to register on this instance will be granted full Administrative access.
                                        </p>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="mr-2 h-4 w-4" /> Create Account</>}
                                    </Button>
                                </form>
                            </TabsContent>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4 px-6 pt-0 pb-6">
                            <div className="text-center w-full">
                                <p className="text-xs text-white/20">
                                    By continuing, you agree to our Terms of Service and Privacy Policy.
                                </p>
                            </div>
                        </CardFooter>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}
