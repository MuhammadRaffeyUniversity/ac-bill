import { DispatchWorkspace } from "@/components/operations/dispatch-workspace";
import { requireRole } from "@/src/lib/auth/guards";
import { suggestTeamsForDispatch } from "@/src/lib/dispatch/team-suggestion";
import { db } from "@/src/lib/db";
import { JobStatus, ServiceType } from "@/src/generated/prisma/enums";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function valueOf(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function dayBounds(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const start = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(start.valueOf())) return null;
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export default async function DispatchPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(["DISPATCHER", "DATA_ENTRY"]);
  const params = await searchParams;
  const filters = {
    search: valueOf(params.search),
    status: valueOf(params.status),
    teamId: valueOf(params.teamId),
    serviceType: valueOf(params.serviceType),
    date: valueOf(params.date),
  };
  const date = dayBounds(filters.date);
  const selectedStatuses: JobStatus[] = [JobStatus.BOOKED, JobStatus.ASSIGNED, JobStatus.IN_PROGRESS];
  const status = selectedStatuses.includes(filters.status as JobStatus) ? filters.status as JobStatus : undefined;
  const serviceType = Object.values(ServiceType).includes(filters.serviceType as ServiceType) ? filters.serviceType as ServiceType : undefined;

  const jobs = await db.job.findMany({
      where: {
        status: status ?? { in: selectedStatuses },
        assignedTeamId: filters.teamId === "unassigned" ? null : filters.teamId || undefined,
        serviceType,
        ...(date ? { OR: [{ requestedAt: { gte: date.start, lt: date.end } }, { requestedAt: null, createdAt: { gte: date.start, lt: date.end } }] } : {}),
        ...(filters.search ? { OR: [
          { customer: { name: { contains: filters.search, mode: "insensitive" } } },
          { address: { rawAddress: { contains: filters.search, mode: "insensitive" } } },
          { address: { area: { contains: filters.search, mode: "insensitive" } } },
          { address: { city: { contains: filters.search, mode: "insensitive" } } },
        ] } : {}),
      },
      orderBy: [{ requestedAt: "asc" }, { createdAt: "desc" }],
      take: 100,
      select: { id: true, serviceType: true, status: true, requestedAt: true, createdAt: true, assignedTeamId: true, assignedTeam: { select: { name: true } }, customer: { select: { name: true } }, address: { select: { area: true, city: true, state: true, postcode: true } } },
  });
  const [teams, openJobs] = await Promise.all([
    db.team.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, region: true, serviceAreaTags: true } }),
    db.job.findMany({ where: { status: { in: selectedStatuses } }, select: { assignedTeamId: true, requestedAt: true, createdAt: true } }),
  ]);

  const workday = date ?? dayBounds(new Date().toISOString().slice(0, 10));
  const activeJobsByTeam = new Map<string, number>();
  for (const job of openJobs) {
    const jobDate = job.requestedAt ?? job.createdAt;
    if (workday && (jobDate < workday.start || jobDate >= workday.end)) continue;
    if (job.assignedTeamId) activeJobsByTeam.set(job.assignedTeamId, (activeJobsByTeam.get(job.assignedTeamId) ?? 0) + 1);
  }
  const dispatchTeams = teams.map((team) => ({ ...team, activeJobs: activeJobsByTeam.get(team.id) ?? 0 }));

  return <main className="min-h-screen bg-muted/30 px-4 py-6 md:px-8 md:py-10"><div className="mx-auto grid max-w-7xl gap-6"><header><h1 className="text-2xl font-semibold">Dispatch</h1><p className="mt-1 text-sm text-muted-foreground">Filter open work, review the deterministic suggestion, then record the assignment.</p></header><DispatchWorkspace jobs={jobs.map((job) => ({ id: job.id, customer: job.customer.name, area: job.address.area ?? job.address.city, serviceType: job.serviceType, status: job.status, assignedTeam: job.assignedTeam?.name ?? null, suggestions: suggestTeamsForDispatch(dispatchTeams, job.address).slice(0, 3) }))} teams={dispatchTeams} filters={filters} /></div></main>;
}
