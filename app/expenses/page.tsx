import { OperationsShell, WorkflowPanel } from "@/components/operations-shell";
import { requireRole } from "@/src/lib/auth/guards";

export default async function ExpensesPage() {
  await requireRole(["ADMIN", "DATA_ENTRY"]);

  return (
    <OperationsShell
      title="Expenses"
      description="Separate company operating expenses, team expenses, and personal expenses without mixing profit views."
      roleLabel="Expenses view"
      activePath="/expenses"
      metrics={[
        { label: "Team claims", value: "MYR 115", detail: "Pending and approved" },
        { label: "Company expenses", value: "MYR 240", detail: "Rent and operations" },
        { label: "Personal expenses", value: "Hidden", detail: "CEO-only in final reporting" },
      ]}
      rows={[
        { id: "EXP-501", primary: "Petrol", secondary: "Team expense awaiting approval", status: "Pending", amount: "MYR 35.00" },
        { id: "EXP-502", primary: "Team rent", secondary: "Company operating expense", status: "Recorded", amount: "MYR 240.00" },
        { id: "EXP-503", primary: "Parking", secondary: "Job-linked team claim", status: "Approved", amount: "MYR 8.00" },
      ]}
    >
      <WorkflowPanel
        title="Expense separation"
        description="Company and personal expenses are never silently merged into team cash or partner reports."
        items={["Categorize expense", "Approve claim", "Keep ledgers separate"]}
      />
    </OperationsShell>
  );
}
