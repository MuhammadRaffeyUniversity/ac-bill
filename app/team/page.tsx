import { OperationsShell, WorkflowPanel } from "@/components/operations-shell";
import { requireRole } from "@/src/lib/auth/guards";

export default async function TeamPage() {
  await requireRole(["TEAM_LEAD"]);

  return (
    <OperationsShell
      title="Team mobile worklist"
      description="A field-first view for assigned jobs, closeout, cash collection, and job notes."
      roleLabel="Team lead view"
      activePath="/team"
      metrics={[
        { label: "Assigned today", value: "5", detail: "Sorted by time" },
        { label: "Cash held", value: "MYR 420", detail: "Not mixed with online payments" },
        { label: "Need update", value: "2", detail: "Completion or payment missing" },
      ]}
      rows={[
        { id: "JOB-1029", primary: "Johor Bahru repair", secondary: "11:00, 2 units", status: "Assigned" },
        { id: "JOB-1034", primary: "Pasir Gudang service", secondary: "14:30, 1 unit", status: "In progress" },
        { id: "JOB-1037", primary: "Taman Mawar service", secondary: "Needs payment status", status: "Closeout" },
      ]}
    >
      <WorkflowPanel
        title="Field closeout"
        description="Team leads record outcomes without seeing CEO-only financial reports."
        items={["Mark performed", "Record payment", "Submit expense"]}
      />
    </OperationsShell>
  );
}
