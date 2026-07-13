import type { JobFlowState } from "./stage";
import { resolveJobFlowStage } from "./stage";

export type JobQueueGroup = "CREATE_INVOICE" | "ASSIGN_TEAM" | "TEAM_REPORT" | "CUSTOMER_HANDOFF" | "CANCELLED";

export type JobQueueItem = {
  group: JobQueueGroup;
  requestedAt: string | Date | null;
  createdAt: string | Date;
};

const groupPriority: Record<JobQueueGroup, number> = {
  CREATE_INVOICE: 0,
  ASSIGN_TEAM: 1,
  TEAM_REPORT: 2,
  CUSTOMER_HANDOFF: 3,
  CANCELLED: 4,
};

export const jobQueueGroupLabels: Record<JobQueueGroup, string> = {
  CREATE_INVOICE: "Create invoice",
  ASSIGN_TEAM: "Assign team",
  TEAM_REPORT: "Waiting / team report",
  CUSTOMER_HANDOFF: "Customer handoff",
  CANCELLED: "Cancelled",
};

export function getJobQueueGroup(job: JobFlowState): JobQueueGroup {
  if (job.status === "CANCELLED") return "CANCELLED";

  const stage = resolveJobFlowStage(job);
  if (stage === "ASSIGNMENT") return "ASSIGN_TEAM";
  if (stage === "INVOICE") return "CREATE_INVOICE";
  if (stage === "CUSTOMER_HANDOFF") return "CUSTOMER_HANDOFF";
  return "TEAM_REPORT";
}

export function compareJobQueueItems(a: JobQueueItem, b: JobQueueItem) {
  const priorityDifference = groupPriority[a.group] - groupPriority[b.group];
  if (priorityDifference !== 0) return priorityDifference;

  return toTimestamp(a.requestedAt ?? a.createdAt) - toTimestamp(b.requestedAt ?? b.createdAt);
}

function toTimestamp(value: string | Date) {
  return value instanceof Date ? value.valueOf() : new Date(value).valueOf();
}
