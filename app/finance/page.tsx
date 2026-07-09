import { OperationsShell, WorkflowPanel } from "@/components/operations-shell";
import { requireRole } from "@/src/lib/auth/guards";

export default async function FinancePage() {
  await requireRole(["ADMIN"]);

  return (
    <OperationsShell
      title="Finance reports"
      description="CEO-only daily, weekly, monthly, and yearly reports matching workbook-style reconciliation."
      roleLabel="CEO finance"
      activePath="/finance"
      metrics={[
        { label: "Daily earnings", value: "MYR 351.50", detail: "Salary plus commission company share" },
        { label: "Balance received", value: "MYR 960.00", detail: "Online plus deposited cash" },
        { label: "Mismatch", value: "MYR -608.50", detail: "Requires reconciliation" },
      ]}
      rows={[
        { id: "FIN-1001", primary: "Salary team profit", secondary: "Sales minus sender share and expenses", status: "Verified", amount: "MYR 267.50" },
        { id: "FIN-1002", primary: "Commission team company share", secondary: "15% company split", status: "Verified", amount: "MYR 84.00" },
        { id: "FIN-1003", primary: "Company expenses", secondary: "Operating expenses shown separately", status: "Open", amount: "MYR 240.00" },
      ]}
    >
      <WorkflowPanel
        title="CEO-only controls"
        description="Financial views stay hidden from dispatchers, team leads, partners, and customers."
        items={["Daily report", "Commission report", "Cash reconciliation"]}
      />
    </OperationsShell>
  );
}
