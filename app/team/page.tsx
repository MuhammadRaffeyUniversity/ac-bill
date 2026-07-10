import { JobsWorkspace } from "@/components/operations/jobs-workspace";
import { requireRole } from "@/src/lib/auth/guards";
import { db } from "@/src/lib/db";

export default async function TeamPage() {
  const session = await requireRole(["TEAM_LEAD"]);
  const teamId = session.user.teamId;
  const jobs = teamId ? await db.job.findMany({
    where: { assignedTeamId: teamId },
    orderBy: [{ requestedAt: "asc" }, { createdAt: "desc" }],
    take: 100,
    select: { id: true, serviceType: true, status: true, paymentStatus: true, customer: { select: { name: true } }, address: { select: { rawAddress: true } }, assignedTeam: { select: { name: true } } },
  }) : [];

  return <main className="min-h-screen bg-muted/30 px-4 py-6 md:px-8 md:py-10"><div className="mx-auto grid max-w-7xl gap-6"><header><h1 className="text-2xl font-semibold">Team worklist</h1><p className="mt-1 text-sm text-muted-foreground">A field-first record of jobs assigned to your team. Operational closeout is recorded by data entry or dispatch.</p></header><JobsWorkspace canCloseout={false} readOnlyMessage={teamId ? "Team leads can review only their assigned jobs here. Send completion, payment, and expense updates to data entry for recording." : "Your account is not assigned to a team yet. Ask an administrator to set your team before using the worklist."} jobs={jobs.map((job) => ({ id: job.id, customer: job.customer.name, address: job.address.rawAddress, serviceType: job.serviceType, status: job.status, paymentStatus: job.paymentStatus, team: job.assignedTeam?.name ?? null }))} /></div></main>;
}
