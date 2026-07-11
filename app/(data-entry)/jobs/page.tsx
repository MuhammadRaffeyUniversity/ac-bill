import { JobsWorkspace } from "@/components/operations/jobs-workspace";
import { requireRole } from "@/src/lib/auth/guards";
import { db } from "@/src/lib/db";

export default async function JobsPage() {
  const session = await requireRole(["DISPATCHER", "DATA_ENTRY", "TEAM_LEAD", "VIEWER"]);
  const teamScope = session.user.role === "TEAM_LEAD" ? session.user.teamId ?? "__unassigned_team__" : undefined;
  const jobs = await db.job.findMany({
    where: { assignedTeamId: teamScope },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, serviceType: true, status: true, paymentStatus: true, customer: { select: { name: true } }, address: { select: { rawAddress: true } }, assignedTeam: { select: { name: true } } },
  });
  const isTeamLead = session.user.role === "TEAM_LEAD";

  return <main className="min-h-screen bg-muted/30 px-4 py-6 md:px-8 md:py-10"><div className="mx-auto grid max-w-7xl gap-6"><header><h1 className="text-2xl font-semibold">{isTeamLead ? "My team jobs" : "Jobs"}</h1><p className="mt-1 text-sm text-muted-foreground">{isTeamLead ? "Only jobs assigned to your team are visible here." : "Review live job records and record a complete, auditable closeout."}</p></header><JobsWorkspace canCloseout={["DATA_ENTRY", "DISPATCHER"].includes(session.user.role)} readOnlyMessage={isTeamLead && !session.user.teamId ? "Your account is not assigned to a team yet. Ask an administrator to set your team before using the worklist." : undefined} jobs={jobs.map((job) => ({ id: job.id, customer: job.customer.name, address: job.address.rawAddress, serviceType: job.serviceType, status: job.status, paymentStatus: job.paymentStatus, team: job.assignedTeam?.name ?? null }))} /></div></main>;
}
