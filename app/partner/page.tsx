import { OperationsShell, WorkflowPanel } from "@/components/operations-shell";
import { requireRole } from "@/src/lib/auth/guards";

export default async function PartnerPage() {
  await requireRole(["ADMIN", "PARTNER_VIEWER"]);

  return (
    <OperationsShell
      title="Sender commission"
      description="Read-only outsourced WhatsApp sender reporting for the 25% partner share."
      roleLabel="Partner view"
      activePath="/partner"
      metrics={[
        { label: "Sender share", value: "MYR 267.50", detail: "From reviewed sales" },
        { label: "Jobs counted", value: "12", detail: "Completed or invoice-ready" },
        { label: "Pending review", value: "3", detail: "Not included yet" },
      ]}
      rows={[
        { id: "COM-3301", primary: "Salary team sender share", secondary: "25% of MYR 510", status: "Reviewed", amount: "MYR 127.50" },
        { id: "COM-3302", primary: "Commission team sender share", secondary: "25% of MYR 560", status: "Reviewed", amount: "MYR 140.00" },
      ]}
    >
      <WorkflowPanel
        title="Partner access"
        description="Partner users see commission reporting only, never CEO expenses or team cash ledgers."
        items={["Reviewed jobs only", "Sender share", "No internal expenses"]}
      />
    </OperationsShell>
  );
}
