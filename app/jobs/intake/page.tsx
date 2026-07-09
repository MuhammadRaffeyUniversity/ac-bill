import { OperationsShell, WorkflowPanel } from "@/components/operations-shell";
import { requireRole } from "@/src/lib/auth/guards";

export default async function IntakePage() {
  await requireRole(["ADMIN", "DISPATCHER", "DATA_ENTRY"]);

  return (
    <OperationsShell
      title="WhatsApp intake"
      description="Paste outsourced WhatsApp messages, review Grok extraction, and save only after human confirmation."
      roleLabel="Intake view"
      activePath="/jobs/intake"
      metrics={[
        { label: "Pending review", value: "5", detail: "Raw messages waiting" },
        { label: "Missing postcode", value: "3", detail: "Needs operator edit" },
        { label: "Ready to book", value: "8", detail: "Required fields confirmed" },
      ]}
      rows={[
        { id: "MSG-4491", primary: "Customer name pending", secondary: "Pasir Gudang, 1 unit service", status: "Review" },
        { id: "MSG-4492", primary: "Sender job", secondary: "Melaka, install request", status: "Parsed" },
        { id: "MSG-4493", primary: "Address needs postcode", secondary: "Nilai, 3 units", status: "Missing field" },
      ]}
    >
      <WorkflowPanel
        title="Human review gate"
        description="The model extracts fields only; it never calculates money or saves jobs silently."
        items={["Preserve raw text", "Edit parsed fields", "Save as booked"]}
      />
    </OperationsShell>
  );
}
