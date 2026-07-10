import { TeamSetupWorkspace } from "@/components/team-setup/team-setup-workspace";
import { requireRole } from "@/src/lib/auth/guards";
import { db } from "@/src/lib/db";

export default async function TeamSetupPage() {
  await requireRole(["DATA_ENTRY"]);

  const teams = await db.team.findMany({
    orderBy: [{ compensationType: "asc" }, { name: "asc" }],
    select: { id: true, name: true, region: true, compensationType: true, serviceAreaTags: true },
  });

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-6 text-foreground md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl">
        <TeamSetupWorkspace teams={teams} />
      </div>
    </main>
  );
}
