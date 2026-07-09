export type CommandCenterIssue = "Assign" | "Payment" | "Review" | "On track";
export type CommandCenterTone = "danger" | "warning" | "success";

type CommandCenterJobInput = {
  id: string;
  suggestedTeam: string;
  payment: string;
  status: string;
};

export type CommandCenterJob<T extends CommandCenterJobInput> = T & {
  issue: CommandCenterIssue;
  tone: CommandCenterTone;
};

const attentionPriority: Record<CommandCenterIssue, number> = {
  Assign: 0,
  Payment: 1,
  Review: 2,
  "On track": 3,
};

export function getCommandCenterJobs<T extends CommandCenterJobInput>(jobs: readonly T[]) {
  const mapped = jobs.map((job): CommandCenterJob<T> => {
    if (job.suggestedTeam === "Unassigned") {
      return { ...job, issue: "Assign", tone: "danger" };
    }

    if (job.status === "Booked") {
      return { ...job, issue: "Review", tone: "warning" };
    }

    if (job.payment === "Unpaid" || job.payment === "Not recorded") {
      return { ...job, issue: "Payment", tone: "warning" };
    }

    return { ...job, issue: "On track", tone: "success" };
  });

  const attention = mapped
    .filter((job) => job.issue !== "On track")
    .toSorted((left, right) => attentionPriority[left.issue] - attentionPriority[right.issue]);

  return {
    attention,
    onTrack: mapped.filter((job) => job.issue === "On track"),
  };
}
