import { OperationsShell, WorkflowPanel } from "@/components/operations-shell";
import { requireRole } from "@/src/lib/auth/guards";

export default async function DispatchPage() {
  await requireRole(["ADMIN", "DISPATCHER", "DATA_ENTRY"]);

  return (
    <OperationsShell
      title="Dispatch board"
      description="Assign booked WhatsApp jobs, review team fit, and keep same-day work moving."
      roleLabel="Dispatcher view"
      activePath="/dispatch"
      metrics={[
        { label: "Booked", value: "7", detail: "Need assignment review" },
        { label: "Assigned", value: "11", detail: "Across active teams" },
        { label: "Blocked", value: "2", detail: "Missing address or payment status" },
      ]}
      rows={[
        { id: "JOB-1028", primary: "Pasir Gudang service", secondary: "Suggested: Salary team 2", status: "Booked" },
        { id: "JOB-1029", primary: "Johor Bahru repair", secondary: "Suggested: Salary team 1", status: "Assigned" },
        { id: "JOB-1030", primary: "Melaka install", secondary: "Suggested: Commission team", status: "In progress" },
      ]}
    >
      <WorkflowPanel
        title="Dispatch checks"
        description="Assignment stays reviewable and can be overridden with a reason."
        items={["Confirm area/postcode", "Check team workload", "Record override reason"]}
      />
    </OperationsShell>
  );
}
