import dynamic from "next/dynamic";
import { QBOProtected } from "@/components/qbo/QBOProtected";

const BankUploadWizard = dynamic(
  () =>
    import("@/components/bank-entries/BankUploadWizard").then((m) => m.BankUploadWizard),
  {
    loading: () => (
      <div className="glass p-8 rounded-2xl text-center text-muted-foreground animate-pulse">
        Loading bank entry tools…
      </div>
    ),
  }
);

export default function BankEntriesPage() {
  return (
    <QBOProtected>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground gradient-text">
              Post Bank Entries
            </h1>
            <p className="text-muted-foreground">
              Upload bank statements and map transactions to QuickBooks ledgers
            </p>
          </div>
        </div>

        <BankUploadWizard />
      </div>
    </QBOProtected>
  );
}
