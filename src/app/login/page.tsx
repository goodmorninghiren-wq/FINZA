"use client";

export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    LogIn, UserPlus, Mail, Lock, Loader2,
    Building2, Eye, EyeOff, ArrowLeft,
    BarChart3, Shield, Zap, CheckCircle2
} from 'lucide-react';

// ─── Design tokens ────────────────────────────────────────────────────────────
const NAVY    = "#0F2445";   // deep navy
const BLUE    = "#1E3A5F";   // mid navy
const ACCENT  = "#2E86AB";   // teal-blue
const LIGHT   = "#EEF4FB";   // pale blue tint
const WHITE   = "#FFFFFF";
const SLATE   = "#64748B";
const BORDER  = "#CBD5E1";

function LoginForm() {
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';

    const [email, setEmail]               = useState('');
    const [password, setPassword]         = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading]       = useState(false);
    const [error, setError]               = useState<string | null>(null);
    const [activeTab, setActiveTab]       = useState(defaultTab);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
            });

            const raw = await res.text();
            let data: { error?: string; hint?: string } = {};
            if (raw.trim()) {
                try { data = JSON.parse(raw); }
                catch {
                    setError('Login returned an invalid response. Restart with: npm run dev');
                    return;
                }
            } else if (!res.ok) {
                setError(res.status === 401
                    ? 'Invalid email or password.'
                    : `Login failed (HTTP ${res.status}). Restart with: npm run dev`);
                return;
            }

            if (!res.ok) {
                const msg = [data.error, data.hint].filter(Boolean).join(' ');
                setError(msg || (res.status === 401
                    ? 'Invalid email or password.'
                    : 'Login failed. See console for details.'));
                return;
            }

            window.location.assign('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            const msg = err instanceof Error ? err.message : '';
            setError(msg === 'Failed to fetch'
                ? 'Cannot reach the app login API. Is the dev server running on http://localhost:3000?'
                : msg.toLowerCase().includes('json')
                    ? 'Login response was empty or invalid. Run: npm run dev'
                    : msg || 'Login failed. Please try again.');
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
                body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                if (res.status === 409) {
                    setError("This account already exists! Please use the Sign In tab.");
                } else {
                    setError(data.error || 'Sign up failed.');
                }
                return;
            }

            if (data.session) {
                window.location.assign('/dashboard');
                return;
            }

            setError(data.message ||
                "Success! Check your email to confirm, or ask an admin to disable email confirmation in Supabase.");
        } catch (err: unknown) {
            console.error('SignUp error:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred during sign up.');
        } finally {
            setIsLoading(false);
        }
    };

    const isSignup = activeTab === 'signup';

    return (
        <div className="min-h-screen flex" style={{ background: NAVY }}>

            {/* ── Left panel: Branding ── */}
            <div
                className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden"
                style={{ background: `linear-gradient(145deg, ${NAVY} 0%, ${BLUE} 60%, #1a4a7a 100%)` }}
            >
                {/* Decorative rings */}
                <div
                    className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
                    style={{ background: ACCENT, filter: "blur(2px)" }}
                />
                <div
                    className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-10"
                    style={{ background: ACCENT, filter: "blur(2px)" }}
                />
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-5"
                    style={{ background: WHITE }}
                />

                {/* Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div
                            className="flex h-11 w-11 items-center justify-center rounded-xl"
                            style={{ background: ACCENT }}
                        >
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">RISE360 Automation</span>
                    </div>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                        QuickBooks Automation for Accounting Firms
                    </p>
                </div>

                {/* Hero text */}
                <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 w-fit"
                        style={{ background: "rgba(46,134,171,0.2)", color: "#7EC8E3", border: "1px solid rgba(46,134,171,0.4)" }}
                    >
                        <Zap className="h-3 w-3" />
                        Trusted by 500+ Accounting Firms
                    </div>
                    <h2 className="text-4xl font-bold text-white leading-tight mb-4">
                        Automate your<br />
                        <span style={{ color: "#7EC8E3" }}>QuickBooks</span> workflow
                    </h2>
                    <p className="text-base leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.6)" }}>
                        Bank entry automation, MIS reporting, and real-time financial insights — all in one platform.
                    </p>

                    {/* Feature list */}
                    <div className="space-y-4">
                        {[
                            { icon: BarChart3, text: "Real-time MIS & P&L Reports" },
                            { icon: Zap,       text: "Automated Bank Entry Rules" },
                            { icon: Shield,    text: "Enterprise-grade Security" },
                        ].map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-3">
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
                                    style={{ background: "rgba(46,134,171,0.2)", border: "1px solid rgba(46,134,171,0.4)" }}
                                >
                                    <Icon className="h-4 w-4" style={{ color: "#7EC8E3" }} />
                                </div>
                                <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>
                                    {text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom quote */}
                <div
                    className="relative z-10 rounded-xl p-4"
                    style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                    }}
                >
                    <p className="text-sm italic mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                        "RISE360 Automation cut our bank reconciliation time by 80%. It's become essential for our firm."
                    </p>
                    <div className="flex items-center gap-2">
                        <div
                            className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: ACCENT }}
                        >
                            R
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-white">Rahul Mehta</p>
                            <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Senior Partner, Mehta & Associates</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right panel: Form ── */}
            <div
                className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10"
                style={{ background: "#F8FAFC" }}
            >
                <div className="w-full max-w-[400px]">

                    {/* Back link */}
                    <div className="mb-8">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
                            style={{ color: SLATE }}
                            onMouseEnter={e => (e.currentTarget.style.color = NAVY)}
                            onMouseLeave={e => (e.currentTarget.style.color = SLATE)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Home
                        </Link>
                    </div>

                    {/* Mobile logo */}
                    <div className="flex lg:hidden flex-col items-center mb-8 text-center">
                        <div
                            className="flex h-13 w-13 items-center justify-center rounded-2xl mb-3"
                            style={{ background: `linear-gradient(135deg, ${NAVY}, ${ACCENT})` }}
                        >
                            <Building2 className="h-7 w-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>RISE360 Automation</h1>
                        <p className="text-sm mt-1" style={{ color: SLATE }}>
                            QuickBooks bank entry automation
                        </p>
                    </div>

                    {/* Heading */}
                    <div className="mb-7">
                        <h2 className="text-2xl font-bold mb-1" style={{ color: NAVY }}>
                            {isSignup ? "Create your account" : "Welcome back"}
                        </h2>
                        <p className="text-sm" style={{ color: SLATE }}>
                            {isSignup
                                ? "Register your firm to get started with RISE360 Automation."
                                : "Sign in to your RISE360 Automation workspace."}
                        </p>
                    </div>

                    {/* Tab switcher */}
                    <div
                        className="flex rounded-xl p-1 mb-7"
                        style={{ background: "#E2E8F0" }}
                    >
                        {(['login', 'signup'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setError(null); }}
                                className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200"
                                style={{
                                    background: activeTab === tab ? WHITE : "transparent",
                                    color: activeTab === tab ? NAVY : SLATE,
                                    boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                                }}
                            >
                                {tab === 'login'
                                    ? <><LogIn className="h-4 w-4" /> Sign In</>
                                    : <><UserPlus className="h-4 w-4" /> Create Account</>
                                }
                            </button>
                        ))}
                    </div>

                    {/* Error / Success Banner */}
                    {error && (
                        <div
                            role="alert"
                            className="mb-5 flex items-start gap-2.5 rounded-xl p-3.5 text-sm"
                            style={
                                error.includes('Success')
                                    ? { background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#166534" }
                                    : { background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" }
                            }
                        >
                            <span className="mt-0.5 text-base">{error.includes('Success') ? '✓' : '⚠'}</span>
                            <span className="leading-snug">{error}</span>
                        </div>
                    )}

                    {/* ── Sign In Form ── */}
                    {activeTab === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="email"
                                    className="text-sm font-semibold"
                                    style={{ color: NAVY }}
                                >
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                                        style={{ color: ACCENT }}
                                        aria-hidden
                                    />
                                    <Input
                                        id="email"
                                        type="email"
                                        autoComplete="username"
                                        placeholder="admin@firm.com"
                                        className="h-12 rounded-xl pl-10 text-sm transition-all"
                                        style={{
                                            border: `1.5px solid ${BORDER}`,
                                            background: WHITE,
                                            color: NAVY,
                                        }}
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="password"
                                    className="text-sm font-semibold"
                                    style={{ color: NAVY }}
                                >
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                                        style={{ color: ACCENT }}
                                        aria-hidden
                                    />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        placeholder="Enter your password"
                                        className="h-12 rounded-xl pl-10 pr-11 text-sm transition-all"
                                        style={{
                                            border: `1.5px solid ${BORDER}`,
                                            background: WHITE,
                                            color: NAVY,
                                        }}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                                        style={{ color: SLATE }}
                                        tabIndex={-1}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{
                                    background: `linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 50%, ${ACCENT} 100%)`,
                                    boxShadow: "0 4px 14px rgba(30,58,95,0.35)",
                                }}
                                onMouseEnter={e => !isLoading && ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")}
                                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
                            >
                                {isLoading
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <><LogIn className="h-4 w-4" aria-hidden /> Sign In</>
                                }
                            </button>
                        </form>
                    )}

                    {/* ── Sign Up Form ── */}
                    {activeTab === 'signup' && (
                        <form onSubmit={handleSignUp} className="space-y-5">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="signup-email"
                                    className="text-sm font-semibold"
                                    style={{ color: NAVY }}
                                >
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                                        style={{ color: ACCENT }}
                                        aria-hidden
                                    />
                                    <Input
                                        id="signup-email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="name@firm.com"
                                        className="h-12 rounded-xl pl-10 text-sm"
                                        style={{
                                            border: `1.5px solid ${BORDER}`,
                                            background: WHITE,
                                            color: NAVY,
                                        }}
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="signup-password"
                                    className="text-sm font-semibold"
                                    style={{ color: NAVY }}
                                >
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                                        style={{ color: ACCENT }}
                                        aria-hidden
                                    />
                                    <Input
                                        id="signup-password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        placeholder="Create a secure password"
                                        className="h-12 rounded-xl pl-10 pr-11 text-sm"
                                        style={{
                                            border: `1.5px solid ${BORDER}`,
                                            background: WHITE,
                                            color: NAVY,
                                        }}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                                        style={{ color: SLATE }}
                                        tabIndex={-1}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Admin note */}
                            <div
                                className="flex items-start gap-3 rounded-xl p-3.5"
                                style={{ background: LIGHT, border: `1px solid rgba(46,134,171,0.25)` }}
                            >
                                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: ACCENT }} />
                                <p className="text-xs leading-relaxed" style={{ color: BLUE }}>
                                    The first person to register on this instance is granted full administrative access.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{
                                    background: `linear-gradient(135deg, ${ACCENT} 0%, #1a6b9a 100%)`,
                                    boxShadow: "0 4px 14px rgba(46,134,171,0.35)",
                                }}
                                onMouseEnter={e => !isLoading && ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")}
                                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
                            >
                                {isLoading
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <><UserPlus className="h-4 w-4" aria-hidden /> Create Account</>
                                }
                            </button>
                        </form>
                    )}

                    {/* Footer */}
                    <p className="mt-8 text-center text-xs" style={{ color: "#94A3B8" }}>
                        By continuing, you agree to our{" "}
                        <span className="font-semibold underline cursor-pointer" style={{ color: SLATE }}>
                            Terms of Service
                        </span>{" "}
                        and{" "}
                        <span className="font-semibold underline cursor-pointer" style={{ color: SLATE }}>
                            Privacy Policy
                        </span>.
                    </p>

                    {/* Powered by strip */}
                    <div className="mt-6 flex items-center justify-center gap-2">
                        <div className="h-px flex-1" style={{ background: "#E2E8F0" }} />
                        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#CBD5E1" }}>
                            Powered by RISE360 Automation
                        </span>
                        <div className="h-px flex-1" style={{ background: "#E2E8F0" }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: NAVY }}
            >
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
