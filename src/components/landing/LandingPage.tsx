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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeInSection } from "./FadeInSection";

const STEPS = [
    {
        step: "1",
        title: "Register & Set Up",
        description:
            "Create your Finza account — the first user on your instance becomes the admin. Complete your firm profile in Settings.",
        icon: UserPlus,
    },
    {
        step: "2",
        title: "Connect QuickBooks",
        description:
            "Authorize Finza to connect to your QuickBooks Online company through secure OAuth. Manage multiple QBO companies from one workspace.",
        icon: Link2,
    },
    {
        step: "3",
        title: "Upload Bank Statements",
        description:
            "Import transactions from CSV or PDF bank statements. PDF files can be parsed automatically through the n8n integration.",
        icon: Upload,
    },
    {
        step: "4",
        title: "Configure Rules",
        description:
            "Build categorization rules that map transactions to the right QBO accounts, vendors, customers, and classes.",
        icon: Wand2,
    },
    {
        step: "5",
        title: "Review & Bulk Post",
        description:
            "Review auto-categorized entries, then post journal entries, invoices, or bills to QuickBooks in bulk.",
        icon: Send,
    },
] as const;

const FEATURES = [
    {
        title: "QuickBooks OAuth",
        description:
            "Secure OAuth 2.0 connection to QuickBooks Online. Tokens are stored encrypted per company.",
        icon: Link2,
    },
    {
        title: "Multi-Company",
        description:
            "Switch between multiple QuickBooks companies without re-authenticating for each session.",
        icon: Layers,
    },
    {
        title: "Rules Engine",
        description:
            "Define rules by payee, amount, or description to auto-assign accounts and dimensions before posting.",
        icon: Wand2,
    },
    {
        title: "Bulk Post",
        description:
            "Post validated bank entries and Excel-based journal entries, invoices, and bills in one workflow.",
        icon: Send,
    },
    {
        title: "CSV & PDF Upload",
        description:
            "Upload structured CSV exports or PDF statements. PDF parsing is handled via your configured n8n webhook.",
        icon: FileSpreadsheet,
    },
    {
        title: "Role-Based Access",
        description:
            "Admin and coworker roles control who can manage settings, rules, and posting across the firm.",
        icon: Users,
    },
] as const;

export function LandingPage() {
    const year = new Date().getFullYear();

    return (
        <>
            <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <Link href="/" className="flex items-center gap-2.5 font-semibold text-[#1E40AF]">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#1E40AF] to-[#6366F1] text-white shadow-md shadow-blue-500/20">
                            <Building2 className="h-5 w-5" aria-hidden />
                        </span>
                        <span className="text-lg tracking-tight">Finza</span>
                    </Link>
                    <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main navigation">
                        <Link href="/login">
                            <Button
                                variant="ghost"
                                className="text-slate-700 hover:bg-slate-100 hover:text-[#1E40AF]"
                            >
                                <LogIn className="mr-2 h-4 w-4" aria-hidden />
                                Login
                            </Button>
                        </Link>
                        <Link href="/login?tab=signup">
                            <Button className="bg-[#1E40AF] text-white shadow-md shadow-blue-500/25 hover:bg-[#1e3a8a]">
                                <UserPlus className="mr-2 h-4 w-4" aria-hidden />
                                Register
                            </Button>
                        </Link>
                    </nav>
                </div>
            </header>

            <main>
                {/* Hero */}
                <section
                    className="relative overflow-hidden bg-gradient-to-br from-[#1E40AF] via-[#2563EB] to-[#6366F1] px-4 py-20 text-white sm:px-6 sm:py-28"
                    aria-labelledby="hero-heading"
                >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
                    <div className="relative mx-auto max-w-4xl text-center animate-fade-in">
                        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">
                            QuickBooks Online automation for CA firms
                        </p>
                        <h1
                            id="hero-heading"
                            className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
                        >
                            Bank entries, rules, and bulk posting — in one place
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-blue-100 sm:text-xl">
                            Finza connects to QuickBooks Online, ingests bank statements, applies your
                            categorization rules, and helps your team post journal entries without
                            repetitive manual work.
                        </p>
                        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Link href="/login">
                                <Button
                                    size="lg"
                                    className="h-12 min-w-[160px] bg-white px-8 text-[#1E40AF] shadow-lg hover:bg-blue-50"
                                >
                                    <LogIn className="mr-2 h-5 w-5" aria-hidden />
                                    Login
                                </Button>
                            </Link>
                            <Link href="/login?tab=signup">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="h-12 min-w-[160px] border-white/40 bg-white/10 px-8 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                                >
                                    <UserPlus className="mr-2 h-5 w-5" aria-hidden />
                                    Register
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* How it works */}
                <FadeInSection
                    id="how-it-works"
                    className="bg-[#F8FAFC] px-4 py-20 sm:px-6"
                    aria-labelledby="how-heading"
                >
                    <div className="mx-auto max-w-6xl">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 id="how-heading" className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                How it works
                            </h2>
                            <p className="mt-4 text-lg text-slate-600">
                                The actual workflow your team follows inside Finza — from signup to
                                posting in QuickBooks.
                            </p>
                        </div>
                        <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {STEPS.map((item) => (
                                <li
                                    key={item.step}
                                    className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/80"
                                >
                                    <div className="mb-4 flex items-center gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E40AF]/10 text-sm font-bold text-[#1E40AF]">
                                            {item.step}
                                        </span>
                                        <item.icon className="h-5 w-5 text-[#6366F1]" aria-hidden />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                        {item.description}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </FadeInSection>

                {/* Features */}
                <FadeInSection
                    id="features"
                    className="px-4 py-20 sm:px-6"
                    aria-labelledby="features-heading"
                >
                    <div className="mx-auto max-w-6xl">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2
                                id="features-heading"
                                className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
                            >
                                Built for accounting firms
                            </h2>
                            <p className="mt-4 text-lg text-slate-600">
                                Core capabilities available in the product today — no filler metrics or
                                placeholder claims.
                            </p>
                        </div>
                        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {FEATURES.map((feature) => (
                                <li
                                    key={feature.title}
                                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#6366F1]/30 hover:shadow-lg hover:shadow-indigo-100/50"
                                >
                                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E40AF]/10 to-[#6366F1]/10">
                                        <feature.icon className="h-5 w-5 text-[#1E40AF]" aria-hidden />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                        {feature.description}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </FadeInSection>

                {/* CTA */}
                <FadeInSection className="bg-[#F8FAFC] px-4 py-16 sm:px-6">
                    <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
                        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                            Ready to streamline your QBO bank entries?
                        </h2>
                        <p className="mt-3 text-slate-600">
                            Create an account, connect QuickBooks, and start uploading bank statements
                            with your team.
                        </p>
                        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link href="/login?tab=signup">
                                <Button
                                    size="lg"
                                    className="bg-[#1E40AF] hover:bg-[#1e3a8a]"
                                >
                                    Create account
                                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button size="lg" variant="outline" className="border-slate-300">
                                    Sign in
                                </Button>
                            </Link>
                        </div>
                    </div>
                </FadeInSection>
            </main>

            <footer className="border-t border-slate-200 bg-white px-4 py-10 sm:px-6">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
                    <div className="flex items-center gap-2 text-[#1E40AF]">
                        <Building2 className="h-5 w-5" aria-hidden />
                        <span className="font-semibold">Finza</span>
                    </div>
                    <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600" aria-label="Footer">
                        <Link href="/login" className="hover:text-[#1E40AF]">
                            Login
                        </Link>
                        <Link href="/login?tab=signup" className="hover:text-[#1E40AF]">
                            Register
                        </Link>
                    </nav>
                    <p className="text-sm text-slate-500">
                        &copy; {year} Finza. All rights reserved.
                    </p>
                </div>
            </footer>
        </>
    );
}
