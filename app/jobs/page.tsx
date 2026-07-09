import { OperationsShell, WorkflowPanel } from "@/components/operations-shell";
import { requireRole } from "@/src/lib/auth/guards";

export default async function JobsPage() {
  await requireRole(["ADMIN", "DISPATCHER", "DATA_ENTRY", "TEAM_LEAD", "VIEWER"]);

  return (
    <OperationsShell
      title="Jobs"
      description="Track customer jobs from booking through service confirmation, payment, invoice, and feedback."
      roleLabel="Jobs view"
      activePath="/jobs"
      metrics={[
        { label: "Open jobs", value: "18", detail: "Booked through in progress" },
        { label: "Need closeout", value: "4", detail: "Performed/payment check missing" },
        { label: "Ready to invoice", value: "6", detail: "Service confirmed" },
      ]}
      rows={[
        { id: "JOB-1028", primary: "Customer review pending", secondary: "Raw WhatsApp message retained", status: "Booked" },
        { id: "JOB-1029", primary: "Walk-in WhatsApp lead", secondary: "Payment unpaid", status: "Assigned" },
        { id: "JOB-1030", primary: "Sender job", secondary: "Split payment recorded", status: "In progress" },
      ]}
    >
      <WorkflowPanel
        title="Closeout requirements"
        description="Jobs cannot become complete until the work and payment outcome are both recorded."
        items={["Performed status", "Payment handling", "Invoice after service"]}
      />
    </OperationsShell>
  );
}
