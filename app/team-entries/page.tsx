import { TeamEntriesWorkspace } from "@/components/team-entries/team-entries-workspace";
import { requireRole } from "@/src/lib/auth/guards";
import { db } from "@/src/lib/db";

export default async function TeamEntriesPage() {
  const session = await requireRole(["DATA_ENTRY"]);
  const [teams, members, jobs, entries] = await Promise.all([
    db.team.findMany({ where: { active: true }, orderBy: [{ region: "asc" }, { name: "asc" }], select: { id: true, name: true, region: true } }),
    db.teamMember.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, teamId: true } }),
    db.job.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, serviceType: true, assignedTeamId: true, createdAt: true, customer: { select: { name: true } } } }),
    db.teamSubmittedEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true, entryType: true, rawWhatsAppText: true, notes: true, entryDate: true, reviewStatus: true,
        team: { select: { name: true } },
        submittedByMember: { select: { name: true } },
        enteredByOperator: { select: { name: true } },
        job: { select: { customer: { select: { name: true } }, serviceType: true } },
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-6 text-foreground md:px-8 md:py-10">
      <div className="mx-auto grid max-w-7xl gap-6">
        <TeamEntriesWorkspace
          canEdit
          operatorName={session.user.name || "Data-entry operator"}
          teams={teams}
          members={members}
          jobs={jobs.map((job) => ({ id: job.id, customerName: job.customer.name, serviceType: job.serviceType, assignedTeamId: job.assignedTeamId, createdAt: job.createdAt.toISOString() }))}
          entries={entries.map((entry) => ({
            id: entry.id, entryType: entry.entryType, rawWhatsAppText: entry.rawWhatsAppText, notes: entry.notes,
            entryDate: entry.entryDate.toISOString(), reviewStatus: entry.reviewStatus, teamName: entry.team.name,
            memberName: entry.submittedByMember?.name ?? null, operatorName: entry.enteredByOperator?.name ?? null,
            jobLabel: entry.job ? `${entry.job.customer.name} - ${entry.job.serviceType.toLowerCase()}` : null,
          }))}
          entryDate={new Date().toISOString().slice(0, 10)}
        />
      </div>
    </main>
  );
}
