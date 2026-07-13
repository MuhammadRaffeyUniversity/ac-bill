import Link from "next/link";

import { Prisma } from "@/src/generated/prisma/client";
import { JobStatus } from "@/src/generated/prisma/enums";

import { JobFlowShell } from "@/components/job-flow/job-flow-shell";
import type { JobFlowQueueRow } from "@/components/job-flow/job-action-queue";
import { JobStageRail } from "@/components/job-flow/job-stage-rail";
import { JobSummary } from "@/components/job-flow/job-summary";
import { AssignStage } from "@/components/job-flow/stages/assign-stage";
import { HandoffStage } from "@/components/job-flow/stages/handoff-stage";
import { IntakeStage } from "@/components/job-flow/stages/intake-stage";
import { InvoiceStage } from "@/components/job-flow/stages/invoice-stage";
import { ReportStage } from "@/components/job-flow/stages/report-stage";
import { requireRole } from "@/src/lib/auth/guards";
import { db } from "@/src/lib/db";
import { suggestTeamsForDispatch } from "@/src/lib/dispatch/team-suggestion";
import { compareJobQueueItems, getJobQueueGroup, type JobQueueGroup } from "@/src/lib/job-flow/queue";
import { resolveJobFlowStage } from "@/src/lib/job-flow/stage";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const selectedJobSelect = {
  id: true, status: true, paymentStatus: true, assignedTeamId: true, performed: true, updatedAt: true, requestedAt: true, serviceType: true, unitsCount: true, rawWhatsAppText: true,
  customer: { select: { name: true, phone: true } },
  address: { select: { rawAddress: true, area: true, city: true, state: true, postcode: true } },
  assignedTeam: { select: { name: true, members: { where: { active: true }, orderBy: { name: "asc" as const }, select: { id: true, name: true } } } },
  sourcePartner: { select: { name: true } },
  submittedEntries: { where: { entryType: "COMPLETION" as const, reviewStatus: "APPROVED" as const }, orderBy: { createdAt: "desc" as const }, take: 1, select: { parsedFields: true, rawWhatsAppText: true } },
  feedback: { select: { id: true } },
  invoice: { select: { id: true, invoiceNumber: true, total: true, payments: { select: { amount: true } }, items: { select: { description: true, quantity: true, unitPrice: true } } } },
} satisfies Prisma.JobSelect;

type SelectedJobRecord = Prisma.JobGetPayload<{ select: typeof selectedJobSelect }>;
type HandoffTokens = { printableToken: string; feedbackToken: string };

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireRole(["DATA_ENTRY", "DISPATCHER", "TEAM_LEAD", "VIEWER"]);
  const params = await searchParams;
  const selectedId = valueOf(params.job);
  const mode = valueOf(params.mode);
  const view = valueOf(params.view);
  const search = valueOf(params.search);
  const teamScope = session.user.role === "TEAM_LEAD" ? session.user.teamId ?? "__unassigned_team__" : undefined;

  const [queueJobs, selectedJob, teams] = await Promise.all([
    db.job.findMany({
      where: {
        assignedTeamId: teamScope,
        ...(search ? { OR: [
          { id: { contains: search, mode: "insensitive" } },
          { customer: { name: { contains: search, mode: "insensitive" } } },
          { customer: { normalizedPhone: { contains: search } } },
          { address: { rawAddress: { contains: search, mode: "insensitive" } } },
          { assignedTeam: { name: { contains: search, mode: "insensitive" } } },
        ] } : {}),
      },
      orderBy: { createdAt: "desc" }, take: 100,
      select: { id: true, status: true, assignedTeamId: true, performed: true, requestedAt: true, createdAt: true, serviceType: true, unitsCount: true, customer: { select: { name: true } }, address: { select: { area: true, city: true } }, assignedTeam: { select: { name: true } }, invoice: { select: { id: true } } },
    }),
    selectedId ? db.job.findFirst({ where: { id: selectedId, assignedTeamId: teamScope }, select: selectedJobSelect }) : Promise.resolve(null),
    db.team.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        region: true,
        serviceAreaTags: true,
        _count: {
          select: {
            assignedJobs: {
              where: { status: { in: [JobStatus.BOOKED, JobStatus.ASSIGNED, JobStatus.IN_PROGRESS, JobStatus.POSTPONED] } },
            },
          },
        },
      },
    }),
  ]);

  const canAccessCustomerHandoff = session.user.role === "DATA_ENTRY" || session.user.role === "DISPATCHER";
  const handoffTokens = canAccessCustomerHandoff && selectedJob?.invoice && selectedJob.feedback
    ? await loadHandoffTokens(selectedJob.invoice.id)
    : null;

  const requestedGroup = groupForView(view);
  const mappedQueue = queueJobs.map((job) => {
    const group = getJobQueueGroup({ status: job.status, assignedTeamId: job.assignedTeamId, performed: job.performed, invoiceId: job.invoice?.id ?? null });
    return { group, requestedAt: job.requestedAt, createdAt: job.createdAt, row: { id: job.id, customer: job.customer.name, jobNumber: `JOB-${job.id.slice(-6).toUpperCase()}`, summary: `${job.unitsCount} unit ${job.serviceType.toLowerCase()}`, location: job.address.area ?? job.address.city ?? "Area pending", team: job.assignedTeam?.name ?? null, group } satisfies JobFlowQueueRow };
  }).filter((item) => !requestedGroup || requestedGroup === item.group).sort(compareJobQueueItems).map((item) => item.row);

  const showWorkspace = mode === "new" || Boolean(selectedJob);
  return <JobFlowShell rows={mappedQueue} selectedId={selectedJob?.id} search={search} showWorkspace={showWorkspace} backHref={getBackHref(search, view)}>
    {mode === "new" && session.user.role === "DATA_ENTRY" ? <IntakeStage /> : selectedJob ? <SelectedJob job={selectedJob} teams={teams} role={session.user.role} handoffTokens={handoffTokens} /> : <Welcome />}
  </JobFlowShell>;
}

function SelectedJob({ job, teams, role, handoffTokens }: { job: SelectedJobRecord; teams: Array<{ id: string; name: string; region: string | null; serviceAreaTags: string[]; _count: { assignedJobs: number } }>; role: string; handoffTokens: HandoffTokens | null }) {
  const stage = resolveJobFlowStage({ status: job.status, assignedTeamId: job.assignedTeamId, performed: job.performed, invoiceId: job.invoice?.id ?? null });
  const completion = getCompletion(job.submittedEntries[0]?.parsedFields);
  const canAct = stage === "ASSIGNMENT"
    ? role === "DATA_ENTRY" || role === "DISPATCHER"
    : stage === "TEAM_REPORT"
      ? role === "DATA_ENTRY"
      : stage === "INVOICE"
        ? role === "DATA_ENTRY" || role === "DISPATCHER"
        : stage === "CUSTOMER_HANDOFF"
          ? Boolean(handoffTokens)
          : true;
  return <div className="grid gap-4"><div><p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">JOB-{job.id.slice(-6).toUpperCase()}</p><h1 className="mt-1 text-2xl font-semibold">{job.customer.name}</h1></div><JobStageRail current={stage} /><JobSummary customer={job.customer.name} phone={job.customer.phone} address={job.address.rawAddress} summary={`${job.unitsCount} unit ${job.serviceType.toLowerCase()}`} team={job.assignedTeam?.name ?? null} />{canAct ? renderStage() : <section className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">This role can review the job but cannot change this stage.</section>}</div>;

  function renderStage() {
    if (stage === "ASSIGNMENT") {
      const rankedTeams = suggestTeamsForDispatch(
        teams.map((team) => ({ id: team.id, name: team.name, region: team.region, serviceAreaTags: team.serviceAreaTags, activeJobs: team._count.assignedJobs })),
        job.address,
      );
      const teamsById = new Map(teams.map((team) => [team.id, team]));
      return <AssignStage jobId={job.id} teams={rankedTeams.map((suggestion) => { const team = teamsById.get(suggestion.teamId)!; return { id: team.id, name: team.name, region: team.region, activeJobs: team._count.assignedJobs, reason: suggestion.reason }; })} />;
    }
    if (stage === "TEAM_REPORT") return <ReportStage jobId={job.id} updatedAt={job.updatedAt.toISOString()} cancelled={job.status === "CANCELLED"} members={job.assignedTeam?.members ?? []} />;
    if (stage === "INVOICE") return <InvoiceStage jobId={job.id} amount={completion.amount} payments={completion.payments} />;
    if (stage === "CUSTOMER_HANDOFF" && job.invoice && handoffTokens) {
      const paid = job.invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      return <HandoffStage invoiceNumber={job.invoice.invoiceNumber} total={Number(job.invoice.total)} paid={paid} invoicePath={`/invoice/${handoffTokens.printableToken}`} pdfPath={`/api/invoice/${handoffTokens.printableToken}/pdf`} feedbackPath={`/feedback/${handoffTokens.feedbackToken}`} />;
    }
    return <IntakeStage />;
  }
}

function getCompletion(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { amount: 0, payments: [] };
  const data = value as { completedAmount?: unknown; payments?: unknown };
  const payments = Array.isArray(data.payments) ? data.payments.filter((payment): payment is { method: string; amount: number; collectedByTeam: boolean; referenceNumber?: string; notes?: string } => Boolean(payment && typeof payment === "object" && typeof (payment as { amount?: unknown }).amount === "number")) : [];
  return { amount: typeof data.completedAmount === "number" ? data.completedAmount : 0, payments };
}

function groupForView(view: string): JobQueueGroup | null { return view === "assignment" ? "ASSIGN_TEAM" : view === "team-report" ? "TEAM_REPORT" : view === "invoice" ? "CREATE_INVOICE" : null; }
function valueOf(value: string | string[] | undefined) { return typeof value === "string" ? value.trim() : ""; }
function Welcome() { return <section className="grid min-h-96 place-items-center rounded-xl border border-dashed bg-card p-8 text-center"><div><h1 className="text-2xl font-semibold">Choose the next job</h1><p className="mt-2 text-sm text-muted-foreground">Select a job from the action queue or start with a new WhatsApp booking.</p><Link href="/jobs?mode=new" className="mt-4 inline-flex text-sm font-medium text-primary underline underline-offset-4">New WhatsApp job</Link></div></section>; }

async function loadHandoffTokens(invoiceId: string): Promise<HandoffTokens | null> {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    select: { printableToken: true, job: { select: { feedback: { select: { token: true } } } } },
  });
  if (!invoice?.job.feedback) return null;
  return { printableToken: invoice.printableToken, feedbackToken: invoice.job.feedback.token };
}

function getBackHref(search: string, view: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (view) params.set("view", view);
  return params.size ? `/jobs?${params.toString()}` : "/jobs";
}
