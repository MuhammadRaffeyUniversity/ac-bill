import type { JobStatus } from "@/src/generated/prisma/enums";

export type JobFlowStage = "WHATSAPP" | "ASSIGNMENT" | "TEAM_REPORT" | "INVOICE" | "CUSTOMER_HANDOFF";

export type JobFlowState = {
  status: JobStatus;
  assignedTeamId: string | null;
  performed: boolean | null;
  invoiceId: string | null;
};

export function resolveJobFlowStage(job: JobFlowState | null): JobFlowStage {
  if (!job) return "WHATSAPP";
  if (job.invoiceId) return "CUSTOMER_HANDOFF";
  if (job.status === "COMPLETED" && job.performed) return "INVOICE";
  if (!job.assignedTeamId && job.status !== "CANCELLED") return "ASSIGNMENT";
  return "TEAM_REPORT";
}
