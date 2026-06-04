import { AppLayout } from "@/components/layout/Layout";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AppLayout>{children}</AppLayout>;
}
