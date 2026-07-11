"use client";

import { useActionState } from "react";
import { ArrowRightLeftIcon, FilterIcon, SearchIcon, SparklesIcon, UserRoundCheckIcon, XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/form-select";
import { SelectItem } from "@/components/ui/select";
import { assignJob, type OperationActionState } from "@/src/lib/operations/actions";

type Suggestion = { teamId: string; reason: string; score: number };
type Job = { id: string; customer: string; area: string | null; serviceType: string; status: string; assignedTeam: string | null; suggestions: Suggestion[] };
type Team = { id: string; name: string; region: string | null; serviceAreaTags: string[]; activeJobs: number };
type Filters = { search: string; status: string; teamId: string; serviceType: string; date: string };

export function DispatchWorkspace({ jobs, teams, filters }: { jobs: Job[]; teams: Team[]; filters: Filters }) {
  const [state, formAction, isPending] = useActionState(assignJob, initialOperationActionState);
  const teamById = new Map(teams.map((team) => [team.id, team]));

  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
    <Card className="overflow-visible"><CardHeader className="gap-4"><div><CardTitle>Live dispatch queue</CardTitle><CardDescription>Booked, assigned, and in-progress jobs from the operational database.</CardDescription></div><form action="/dispatch" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><label className="relative sm:col-span-2"><SearchIcon className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" /><input name="search" defaultValue={filters.search} className={`${controlClass} pl-9`} placeholder="Customer or area" aria-label="Search customer or area" /></label><FormSelect name="status" defaultValue={filters.status} placeholder="All open statuses"><SelectItem value="">All open statuses</SelectItem><SelectItem value="BOOKED">Booked</SelectItem><SelectItem value="ASSIGNED">Assigned</SelectItem><SelectItem value="IN_PROGRESS">In progress</SelectItem></FormSelect><FormSelect name="teamId" defaultValue={filters.teamId} placeholder="All teams"><SelectItem value="">All teams</SelectItem><SelectItem value="unassigned">Unassigned</SelectItem>{teams.map((team) => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}</FormSelect><FormSelect name="serviceType" defaultValue={filters.serviceType} placeholder="All services"><SelectItem value="">All services</SelectItem><SelectItem value="SERVICE">Service</SelectItem><SelectItem value="REPAIR">Repair</SelectItem><SelectItem value="INSTALL">Install</SelectItem></FormSelect><input type="date" name="date" defaultValue={filters.date} className={controlClass} aria-label="Filter by date" /><div className="flex gap-2 sm:col-span-2 lg:col-span-5"><Button type="submit" variant="secondary" size="sm"><FilterIcon data-icon="inline-start" />Apply filters</Button>{Object.values(filters).some(Boolean) ? <a href="/dispatch" className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground" aria-label="Clear filters"><XIcon className="size-4" /></a> : null}</div></form></CardHeader><CardContent>
      {jobs.length ? <div className="divide-y rounded-lg border">{jobs.map((job) => { const suggestion = job.suggestions[0]; const suggestedTeam = suggestion ? teamById.get(suggestion.teamId) : undefined; return <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div><p className="font-medium">{job.customer}</p><p className="mt-1 text-xs text-muted-foreground">{job.serviceType.toLowerCase()} {job.area ? `- ${job.area}` : "- area pending"}</p>{suggestedTeam ? <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><SparklesIcon className="size-3" />Suggested: {suggestedTeam.name} - {suggestion.reason}</p> : null}</div><div className="flex items-center gap-2"><Badge variant="outline">{job.status.replace("_", " ")}</Badge><span className="text-xs text-muted-foreground">{job.assignedTeam ?? "Unassigned"}</span></div></div>; })}</div> : <Empty text="No open jobs match these filters." />}
    </CardContent></Card>
    <Card className="h-fit"><CardHeader><CardTitle>Assign a team</CardTitle><CardDescription>Suggestions use service-area tags first, then today&apos;s open workload. You can always override.</CardDescription></CardHeader><CardContent>
      {teams.length && jobs.length ? <form action={formAction} className="grid gap-4"><Field label="Job"><FormSelect name="jobId" placeholder="Choose job" required><SelectItem value="">Choose job</SelectItem>{jobs.map((job) => <SelectItem key={job.id} value={job.id}>{job.customer} - {job.serviceType.toLowerCase()}</SelectItem>)}</FormSelect></Field><Field label="Active team"><FormSelect name="teamId" placeholder="Choose team" required><SelectItem value="">Choose team</SelectItem>{teams.map((team) => <SelectItem key={team.id} value={team.id}>{team.name}{team.region ? ` - ${team.region}` : ""} ({team.activeJobs} open today)</SelectItem>)}</FormSelect></Field><Field label="Assignment note"><textarea name="note" maxLength={500} className={`${controlClass} min-h-20 resize-y`} placeholder="Optional handoff context or override reason" /></Field><FormNotice state={state} /><Button type="submit" disabled={isPending}><ArrowRightLeftIcon data-icon="inline-start" />{isPending ? "Assigning..." : "Assign job"}</Button></form> : <Empty text={teams.length ? "Create a job before assigning it." : "No active teams are configured yet."} />}
    </CardContent></Card>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-sm"><span className="font-medium">{label}</span>{children}</label>; }
function FormNotice({ state }: { state: { error?: string; success?: string } }) { return state.error ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p> : state.success ? <p role="status" className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p> : null; }
function Empty({ text }: { text: string }) { return <div className="grid min-h-28 place-items-center rounded-md border border-dashed px-4 text-center text-sm text-muted-foreground"><UserRoundCheckIcon className="mb-2 size-4" />{text}</div>; }
const controlClass = "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";
const initialOperationActionState: OperationActionState = {};
