import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rise360.app";

export const metadata: Metadata = {
    title: "RISE360 Automation — QuickBooks Bank Entry Automation for CA Firms",
    description:
        "RISE360 Automation connects to QuickBooks Online, uploads bank statements (CSV/PDF), applies categorization rules, and bulk-posts journal entries for accounting firms.",
    keywords: [
        "QuickBooks Online",
        "bank entry automation",
        "CA firms",
        "accounting software",
        "bulk journal entries",
        "bank statement upload",
        "rules engine",
    ],
    authors: [{ name: "RISE360 Automation" }],
    openGraph: {
        type: "website",
        locale: "en_IN",
        url: siteUrl,
        siteName: "RISE360 Automation",
        title: "RISE360 Automation — QuickBooks Bank Entry Automation for CA Firms",
        description:
            "Connect QBO, upload bank statements, apply rules, and bulk-post entries — built for CA and accounting firms.",
    },
    twitter: {
        card: "summary_large_image",
        title: "RISE360 Automation — QuickBooks Bank Entry Automation",
        description:
            "Connect QBO, upload bank statements, apply rules, and bulk-post entries for accounting firms.",
    },
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
        canonical: siteUrl,
    },
};

export default function HomePage() {
    return <LandingPage />;
}
