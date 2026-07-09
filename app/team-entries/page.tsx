import { OperationsShell, WorkflowPanel } from "@/components/operations-shell";
import { requireRole } from "@/src/lib/auth/guards";

export default async function TeamEntriesPage() {
  await requireRole(["ADMIN", "DATA_ENTRY"]);

  return (
    <OperationsShell
      title="Team WhatsApp entries"
      description="Enter team-submitted job updates, payments, expenses, notes, and corrections with audit history."
      roleLabel="Data-entry view"
      activePath="/team-entries"
      metrics={[
        { label: "Pending entries", value: "9", detail: "Awaiting review" },
        { label: "Expense claims", value: "4", detail: "Petrol, parking, supplies" },
        { label: "Corrections", value: "2", detail: "Need operator approval" },
      ]}
      rows={[
        { id: "ENT-2101", primary: "Completion update", secondary: "Submitted by team lead", status: "Pending" },
        { id: "ENT-2102", primary: "Cash collected", secondary: "Collected by team, not deposited", status: "Review" },
        { id: "ENT-2103", primary: "Petrol expense", secondary: "Needs approval", status: "Pending", amount: "MYR 35.00" },
      ]}
    >
      <WorkflowPanel
        title="Entry audit"
        description="Every team message keeps the submitted text and the operator who entered it."
        items={["Paste raw update", "Map to job/team", "Approve or reject"]}
      />
    </OperationsShell>
  );
}
