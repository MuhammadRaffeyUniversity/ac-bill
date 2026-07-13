import type { JobFlowStage } from "@/src/lib/job-flow/stage";

const stages: Array<{ id: JobFlowStage; label: string }> = [
  { id: "WHATSAPP", label: "WhatsApp" },
  { id: "ASSIGNMENT", label: "Assignment" },
  { id: "TEAM_REPORT", label: "Team report" },
  { id: "INVOICE", label: "Invoice" },
  { id: "CUSTOMER_HANDOFF", label: "Customer handoff" },
];

export function JobStageRail({ current }: { current: JobFlowStage }) {
  const currentIndex = stages.findIndex((stage) => stage.id === current);
  return <ol aria-label="Job progress" className="grid grid-cols-5 overflow-hidden rounded-lg border bg-card">{stages.map((stage, index) => {
    const isDone = index < currentIndex;
    const isCurrent = index === currentIndex;
    return <li key={stage.id} aria-current={isCurrent ? "step" : undefined} className={`min-w-0 border-r px-2 py-2 last:border-r-0 ${isCurrent ? "bg-action-required-muted text-action-required-foreground" : isDone ? "bg-audit text-audit-foreground" : "text-muted-foreground"}`}><span className="font-mono text-[10px]">{isDone ? "✓" : index + 1}</span><span className="ml-1 hidden truncate text-xs font-medium sm:inline">{stage.label}</span></li>;
  })}</ol>;
}
