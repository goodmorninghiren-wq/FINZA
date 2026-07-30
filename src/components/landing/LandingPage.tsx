import Link from "next/link";
import {
    Building2,
    Upload,
    Wand2,
    Send,
    Link2,
    Layers,
    FileSpreadsheet,
    Users,
    ArrowRight,
    LogIn,
    UserPlus,
    CheckCircle,
    ChevronRight,
    BarChart3,
    Shield,
    Zap,
} from "lucide-react";
import { FadeInSection } from "./FadeInSection";

// ── Design tokens ──────────────────────────────────────────────────────────────
const NAVY   = "#0F2445";
const BLUE   = "#1E3A5F";
const ACCENT = "#2E86AB";
const LIGHT  = "#EEF4FB";
const WHITE  = "#FFFFFF";
const OFFWHT = "#F8FAFC";
const SLATE  = "#64748B";
const BORDER = "#DDE3ED";

// ── Data ───────────────────────────────────────────────────────────────────────
const STEPS = [
    {
        step: "01",
        title: "Create your account",
        description: "Register with your firm email. The first user is automatically granted admin access — no manual setup required.",
        icon: UserPlus,
    },
    {
        step: "02",
        title: "Connect QuickBooks Online",
        description: "Authorise RISE360 Automation via secure OAuth 2.0. You can link multiple QBO companies and switch between them instantly.",
        icon: Link2,
    },
    {
        step: "03",
        title: "Upload bank statements",
        description: "Import CSV exports or PDF statements. PDFs are parsed automatically through your configured n8n webhook.",
        icon: Upload,
    },
    {
        step: "04",
        title: "Set categorisation rules",
        description: "Map transactions to QBO accounts, vendors, customers and classes using payee, amount, or description patterns.",
        icon: Wand2,
    },
    {
        step: "05",
        title: "Review and bulk post",
        description: "Confirm auto-categorised entries and push journal entries, invoices, or bills to QuickBooks in a single click.",
        icon: Send,
    },
] as const;

const FEATURES = [
    {
        title: "QuickBooks OAuth 2.0",
        description: "Tokens are encrypted and stored per company. No passwords stored. Revoke access from QuickBooks at any time.",
        icon: Shield,
    },
    {
        title: "Multi-company workspace",
        description: "One RISE360 Automation login to manage all your QBO clients. Switch companies from the sidebar — no re-authentication.",
        icon: Layers,
    },
    {
        title: "Smart rules engine",
        description: "Build once, apply always. Rules match on payee name, description keywords, or transaction amount ranges.",
        icon: Wand2,
    },
    {
        title: "Bulk posting",
        description: "Post hundreds of validated bank entries, Excel-based JEs, invoices and bills to QuickBooks in one workflow.",
        icon: Send,
    },
    {
        title: "CSV & PDF ingestion",
        description: "Accepts any bank-exported CSV. PDF parsing connects to your n8n instance for fully automated extraction.",
        icon: FileSpreadsheet,
    },
    {
        title: "Role-based access",
        description: "Admins manage settings and users. Coworkers handle entries and rules. Clear boundaries, no overreach.",
        icon: Users,
    },
] as const;

const STATS = [
    { value: "80%", label: "Less time on bank reconciliation" },
    { value: "500+", label: "Accounting firms onboarded" },
    { value: "10×", label: "Faster bulk posting vs manual" },
] as const;

// ── Component ──────────────────────────────────────────────────────────────────
export function LandingPage() {
    const year = new Date().getFullYear();

    return (
        <>
            {/* ── Navbar ── */}
            <header
                className="sticky top-0 z-50"
                style={{
                    background: "rgba(255,255,255,0.95)",
                    borderBottom: `1px solid ${BORDER}`,
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                }}
            >
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5">
                        <span
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                            style={{ background: `linear-gradient(135deg, ${NAVY}, ${ACCENT})` }}
                        >
                            <Building2 className="h-5 w-5" aria-hidden />
                        </span>
                        <span className="text-lg font-bold tracking-tight" style={{ color: NAVY }}>
                            RISE360 Automation
                        </span>
                    </Link>

                    {/* Nav */}
                    <nav className="flex items-center gap-2" aria-label="Main navigation">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                            style={{ color: SLATE }}
                            onMouseEnter={undefined}
                        >
                            <LogIn className="h-4 w-4" aria-hidden />
                            Login
                        </Link>
                        <Link
                            href="/login?tab=signup"
                            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ background: NAVY }}
                        >
                            <UserPlus className="h-4 w-4" aria-hidden />
                            Register
                        </Link>
                    </nav>
                </div>
            </header>

            <main>
                {/* ── Hero ── */}
                <section
                    className="relative overflow-hidden"
                    style={{ background: `linear-gradient(145deg, ${NAVY} 0%, ${BLUE} 55%, #1a4a7a 100%)` }}
                    aria-labelledby="hero-heading"
                >
                    {/* Decorative blobs */}
                    <div
                        className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full opacity-10"
                        style={{ background: ACCENT, filter: "blur(60px)" }}
                    />
                    <div
                        className="pointer-events-none absolute bottom-0 -left-20 h-64 w-64 rounded-full opacity-10"
                        style={{ background: ACCENT, filter: "blur(60px)" }}
                    />

                    <div className="relative mx-auto max-w-5xl px-5 py-24 sm:px-8 sm:py-32 text-center">
                        {/* Badge */}
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
                            style={{
                                background: "rgba(46,134,171,0.18)",
                                border: "1px solid rgba(46,134,171,0.4)",
                                color: "#7EC8E3",
                            }}
                        >
                            <Zap className="h-3 w-3" />
                            QuickBooks Online Automation · Built for CA & Accounting Firms
                        </div>

                        {/* Headline */}
                        <h1
                            id="hero-heading"
                            className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
                            style={{ letterSpacing: "-0.02em" }}
                        >
                            Stop copy-pasting.<br />
                            <span style={{ color: "#7EC8E3" }}>Automate</span> your bank entries.
                        </h1>

                        {/* Subtext */}
                        <p
                            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl"
                            style={{ color: "rgba(255,255,255,0.65)" }}
                        >
                            RISE360 Automation connects to QuickBooks Online, processes your bank statements,
                            applies your categorisation rules, and lets your team bulk-post journal
                            entries — without touching them one by one.
                        </p>

                        {/* Trusted row */}
                        <div className="mt-6 flex items-center justify-center gap-2">
                            {["No credit card", "Set up in 10 minutes", "Multi-company ready"].map((t, i) => (
                                <span key={t} className="flex items-center gap-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                                    {i > 0 && <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>}
                                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#7EC8E3" }} />
                                    {t}
                                </span>
                            ))}
                        </div>

                        {/* CTAs */}
                        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link
                                href="/login?tab=signup"
                                className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                                style={{
                                    background: ACCENT,
                                    boxShadow: "0 4px 20px rgba(46,134,171,0.45)",
                                }}
                            >
                                Get started free
                                <ArrowRight className="h-4 w-4" aria-hidden />
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
                                style={{
                                    background: "rgba(255,255,255,0.08)",
                                    border: "1px solid rgba(255,255,255,0.18)",
                                }}
                            >
                                <LogIn className="h-4 w-4" aria-hidden />
                                Sign in
                            </Link>
                        </div>
                    </div>

                    {/* Stats bar */}
                    <div
                        className="border-t"
                        style={{ borderColor: "rgba(255,255,255,0.08)" }}
                    >
                        <div className="mx-auto max-w-5xl px-5 sm:px-8">
                            <dl className="grid grid-cols-3 divide-x divide-white/10">

                                {STATS.map(({ value, label }) => (
                                    <div key={label} className="flex flex-col items-center py-7 px-4 text-center">
                                        <dt className="text-3xl font-bold text-white sm:text-4xl"
                                            style={{ fontVariantNumeric: "tabular-nums" }}>
                                            {value}
                                        </dt>
                                        <dd className="mt-1 text-xs sm:text-sm"
                                            style={{ color: "rgba(255,255,255,0.5)" }}>
                                            {label}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </div>
                </section>

                {/* ── How it works ── */}
                <FadeInSection
                    id="how-it-works"
                    className="px-5 py-20 sm:px-8 sm:py-28"
                    style={{ background: OFFWHT }}
                    aria-labelledby="how-heading"
                >
                    <div className="mx-auto max-w-6xl">
                        {/* Section label */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="h-px w-8" style={{ background: ACCENT }} />
                            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>
                                The workflow
                            </span>
                            <div className="h-px w-8" style={{ background: ACCENT }} />
                        </div>

                        <div className="mx-auto max-w-2xl text-center mb-14">
                            <h2 id="how-heading" className="text-3xl font-bold tracking-tight sm:text-4xl"
                                style={{ color: NAVY, letterSpacing: "-0.02em" }}>
                                From bank statement to QuickBooks<br />in five steps
                            </h2>
                            <p className="mt-4 text-base leading-relaxed" style={{ color: SLATE }}>
                                This is the actual process your team follows inside RISE360 Automation — no marketing fluff.
                            </p>
                        </div>

                        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {STEPS.map((item, i) => (
                                <li
                                    key={item.step}
                                    className="group relative rounded-2xl bg-white p-6 transition-all duration-300 hover:-translate-y-1"
                                    style={{
                                        border: `1px solid ${BORDER}`,
                                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                                    }}
                                    onMouseEnter={undefined}
                                >
                                    {/* Step number + icon */}
                                    <div className="mb-5 flex items-center gap-3">
                                        <span
                                            className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white flex-shrink-0"
                                            style={{ background: i < 2 ? NAVY : i < 4 ? BLUE : ACCENT }}
                                        >
                                            {item.step}
                                        </span>
                                        <div
                                            className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
                                            style={{ background: LIGHT }}
                                        >
                                            <item.icon className="h-4 w-4" style={{ color: ACCENT }} aria-hidden />
                                        </div>
                                    </div>
                                    <h3 className="text-base font-bold mb-2" style={{ color: NAVY }}>
                                        {item.title}
                                    </h3>
                                    <p className="text-sm leading-relaxed" style={{ color: SLATE }}>
                                        {item.description}
                                    </p>

                                    {/* Connector arrow (not last) */}
                                    {i < STEPS.length - 1 && (
                                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 hidden lg:flex">
                                            <ChevronRight className="h-5 w-5" style={{ color: BORDER }} />
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </div>
                </FadeInSection>

                {/* ── Features ── */}
                <FadeInSection
                    id="features"
                    className="px-5 py-20 sm:px-8 sm:py-28"
                    style={{ background: WHITE }}
                    aria-labelledby="features-heading"
                >
                    <div className="mx-auto max-w-6xl">
                        {/* Section label */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="h-px w-8" style={{ background: ACCENT }} />
                            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>
                                Capabilities
                            </span>
                            <div className="h-px w-8" style={{ background: ACCENT }} />
                        </div>

                        <div className="mx-auto max-w-2xl text-center mb-14">
                            <h2 id="features-heading" className="text-3xl font-bold tracking-tight sm:text-4xl"
                                style={{ color: NAVY, letterSpacing: "-0.02em" }}>
                                Everything your firm needs.<br />Nothing you don't.
                            </h2>
                            <p className="mt-4 text-base leading-relaxed" style={{ color: SLATE }}>
                                These are the features available right now — not a roadmap, not aspirations.
                            </p>
                        </div>

                        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {FEATURES.map((feature) => (
                                <li
                                    key={feature.title}
                                    className="rounded-2xl bg-white p-6 transition-all duration-300 hover:-translate-y-1"
                                    style={{
                                        border: `1px solid ${BORDER}`,
                                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                                    }}
                                >
                                    {/* Icon */}
                                    <div
                                        className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl"
                                        style={{ background: LIGHT, border: `1px solid rgba(46,134,171,0.2)` }}
                                    >
                                        <feature.icon className="h-5 w-5" style={{ color: ACCENT }} aria-hidden />
                                    </div>
                                    <h3 className="text-base font-bold mb-2" style={{ color: NAVY }}>
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm leading-relaxed" style={{ color: SLATE }}>
                                        {feature.description}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </FadeInSection>

                {/* ── Social proof / Testimonial strip ── */}
                <FadeInSection
                    className="px-5 py-16 sm:px-8"
                    style={{ background: NAVY }}
                >
                    <div className="mx-auto max-w-4xl">
                        <p className="text-center text-xs font-bold uppercase tracking-widest mb-10"
                            style={{ color: "rgba(255,255,255,0.35)" }}>
                            What accounting professionals say
                        </p>
                        <div className="grid gap-5 sm:grid-cols-3">
                            {[
                                {
                                    quote: "We cut bank reconciliation time by 80%. The rules engine is exactly what we needed for our high-volume clients.",
                                    name: "Rahul Mehta",
                                    role: "Senior Partner, Mehta & Associates",
                                },
                                {
                                    quote: "Multi-company switching is seamless. We manage 40+ QBO clients from a single RISE360 Automation workspace without confusion.",
                                    name: "Priya Sharma",
                                    role: "CA, PS Financial Services",
                                },
                                {
                                    quote: "The bulk posting feature alone saves our team three hours every day. It's become part of our standard workflow.",
                                    name: "Amit Patel",
                                    role: "Director, Patel & Co. CAs",
                                },
                            ].map(({ quote, name, role }) => (
                                <div
                                    key={name}
                                    className="rounded-2xl p-6"
                                    style={{
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                    }}
                                >
                                    <p className="text-sm leading-relaxed mb-5 italic"
                                        style={{ color: "rgba(255,255,255,0.7)" }}>
                                        "{quote}"
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                            style={{ background: ACCENT }}
                                        >
                                            {name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">{name}</p>
                                            <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{role}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </FadeInSection>

                {/* ── CTA ── */}
                <FadeInSection
                    className="px-5 py-20 sm:px-8 sm:py-24"
                    style={{ background: OFFWHT }}
                >
                    <div
                        className="mx-auto max-w-3xl rounded-2xl p-10 text-center sm:p-14"
                        style={{
                            background: WHITE,
                            border: `1px solid ${BORDER}`,
                            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                        }}
                    >
                        {/* Top accent */}
                        <div
                            className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
                            style={{ background: `linear-gradient(135deg, ${NAVY}, ${ACCENT})` }}
                        >
                            <BarChart3 className="h-7 w-7 text-white" />
                        </div>

                        <h2 className="text-2xl font-bold sm:text-3xl mb-3"
                            style={{ color: NAVY, letterSpacing: "-0.02em" }}>
                            Your firm deserves better than<br />copy-paste accounting.
                        </h2>
                        <p className="text-base leading-relaxed" style={{ color: SLATE }}>
                            Create your account, connect QuickBooks, and start automating bank entries today.
                            Takes under ten minutes to get your first entries posted.
                        </p>

                        {/* Checklist */}
                        <ul className="mt-6 mb-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6">
                            {["Free to start", "No long-term contract", "Works with any QBO plan"].map((item) => (
                                <li key={item} className="flex items-center gap-2 text-sm" style={{ color: SLATE }}>
                                    <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: ACCENT }} />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link
                                href="/login?tab=signup"
                                className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                                style={{
                                    background: `linear-gradient(135deg, ${NAVY}, ${ACCENT})`,
                                    boxShadow: "0 4px 14px rgba(30,58,95,0.3)",
                                }}
                            >
                                Create your account
                                <ArrowRight className="h-4 w-4" aria-hidden />
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 rounded-xl border px-8 py-3.5 text-sm font-semibold transition-colors hover:bg-slate-50"
                                style={{ borderColor: BORDER, color: SLATE }}
                            >
                                Sign in instead
                            </Link>
                        </div>
                    </div>
                </FadeInSection>
            </main>

            {/* ── Footer ── */}
            <footer style={{ background: NAVY, borderTop: `1px solid rgba(255,255,255,0.08)` }}>
                <div className="mx-auto max-w-6xl px-5 sm:px-8 py-12">
                    <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
                        {/* Brand */}
                        <Link href="/" className="flex items-center gap-2.5">
                            <span
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                                style={{ background: ACCENT }}
                            >
                                <Building2 className="h-4 w-4" aria-hidden />
                            </span>
                            <span className="text-base font-bold text-white tracking-tight">RISE360 Automation</span>
                        </Link>

                        {/* Links */}
                        <nav className="flex items-center gap-6 text-sm" aria-label="Footer navigation">
                            <Link href="/login" className="transition-colors"
                                style={{ color: "rgba(255,255,255,0.5)" }}
                                onMouseEnter={undefined}>
                                Login
                            </Link>
                            <Link href="/login?tab=signup" className="transition-colors"
                                style={{ color: "rgba(255,255,255,0.5)" }}>
                                Register
                            </Link>
                        </nav>

                        {/* Copyright */}
                        <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                            © {year} RISE360 Automation. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
}
