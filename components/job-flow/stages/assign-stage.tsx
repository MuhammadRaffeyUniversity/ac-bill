"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { SelectItem } from "@/components/ui/select";
import { assignJob, type OperationActionState } from "@/src/lib/operations/actions";
import { getDispatchSelectionLabel } from "@/src/lib/operations/dispatch-selection";

export type FlowTeam = { id: string; name: string; region: string | null; activeJobs: number; reason?: string };

export function AssignStage({ jobId, teams }: { jobId: string; teams: FlowTeam[] }) {
  const [state, action, pending] = useActionState(assignJob, {} as OperationActionState);
  const teamOptions = teams.map((team) => ({ id: team.id, label: `${team.name}${team.region ? ` · ${team.region}` : ""} (${team.activeJobs} open)${team.reason ? ` — ${team.reason}` : ""}` }));
  return <section className="rounded-xl border bg-card p-5"><p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Stage 2 of 5</p><h2 className="mt-1 text-xl font-semibold">Assign an active team</h2><p className="mt-1 text-sm text-muted-foreground">Suggestions use service area and open workload. The operator keeps final control.</p><form action={action} className="mt-5 grid max-w-xl gap-4"><input type="hidden" name="jobId" value={jobId} /><label className="grid gap-1.5 text-sm font-medium">Team<FormSelect name="teamId" required placeholder="Choose team" labelForValue={(value) => getDispatchSelectionLabel(value, teamOptions, "Choose team")}><SelectItem value="">Choose team</SelectItem>{teamOptions.map((team) => <SelectItem key={team.id} value={team.id}>{team.label}</SelectItem>)}</FormSelect></label><label className="grid gap-1.5 text-sm font-medium">Assignment note<textarea name="note" className="min-h-24 rounded-md border bg-background p-3 text-sm" placeholder="Handoff context or override reason" /></label>{state.error ? <p role="alert" className="text-sm text-destructive">{state.error}</p> : null}{state.jobId ? <Link className="text-sm font-medium text-primary underline" href={`/jobs?job=${encodeURIComponent(state.jobId)}`}>Continue to team report</Link> : null}<Button type="submit" disabled={pending}>{pending ? "Assigning…" : "Assign team"}</Button></form></section>;
}
