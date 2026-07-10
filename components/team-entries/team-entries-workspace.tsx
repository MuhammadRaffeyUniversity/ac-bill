"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckIcon,
  ClipboardPenLineIcon,
  FileTextIcon,
  MessageSquareTextIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createTeamEntry, initialActionState, reviewTeamEntry } from "@/src/lib/team-entries/actions";
import { teamEntryTypes } from "@/src/lib/team-entries/schema";

type Team = { id: string; name: string; region: string | null };
type Member = { id: string; name: string; teamId: string };
type Job = { id: string; customerName: string; serviceType: string; assignedTeamId: string | null; createdAt: string };
type Entry = {
  id: string;
  entryType: string;
  rawWhatsAppText: string;
  notes: string | null;
  entryDate: string;
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED";
  teamName: string;
  memberName: string | null;
  jobLabel: string | null;
  operatorName: string | null;
};

type TeamEntriesWorkspaceProps = {
  canEdit: boolean;
  operatorName: string;
  teams: Team[];
  members: Member[];
  jobs: Job[];
  entries: Entry[];
  entryDate: string;
};

const entryTypeLabels: Record<(typeof teamEntryTypes)[number], string> = {
  COMPLETION: "Completion",
  PAYMENT: "Payment",
  EXPENSE: "Expense",
  NOTE: "Note",
  CORRECTION: "Correction",
};

const reviewStyles = {
  PENDING: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300",
  APPROVED: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-300",
  REJECTED: "border-red-300 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-300",
} as const;

export function TeamEntriesWorkspace({ canEdit, operatorName, teams, members, jobs, entries, entryDate }: TeamEntriesWorkspaceProps) {
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [state, formAction, isPending] = useActionState(createTeamEntry, initialActionState);

  const availableMembers = useMemo(
    () => members.filter((member) => member.teamId === selectedTeamId),
    [members, selectedTeamId],
  );
  const availableJobs = useMemo(
    () => jobs.filter((job) => !job.assignedTeamId || job.assignedTeamId === selectedTeamId),
    [jobs, selectedTeamId],
  );

  const pendingCount = entries.filter((entry) => entry.reviewStatus === "PENDING").length;

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 border-b border-border pb-6 sm:flex sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ClipboardPenLineIcon className="size-5" />
          </div>
          <h1 className="text-2xl font-semibold">Team WhatsApp updates</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Capture messages exactly as received, connect them to the correct team and job, then keep the review trail intact.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheckIcon className="size-4 text-primary" />
          <span>{canEdit ? `Entering as ${operatorName}` : "Read-only CEO monitor"}</span>
        </div>
      </section>

      {canEdit ? (
        teams.length ? (
          <Card className="overflow-visible">
            <CardHeader className="border-b">
              <CardTitle>Record an update</CardTitle>
              <CardDescription>A saved update begins as pending review. The original WhatsApp message cannot be replaced from this screen.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form action={formAction} className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
                <div className="grid gap-2">
                  <label htmlFor="rawWhatsAppText" className="text-sm font-medium">Original WhatsApp update</label>
                  <Textarea
                    id="rawWhatsAppText"
                    name="rawWhatsAppText"
                    required
                    minLength={10}
                    className="min-h-52 resize-y font-mono text-sm leading-6"
                    placeholder="Paste the complete message from the team. Keep amounts, dates, and references exactly as sent."
                  />
                  <p className="text-xs text-muted-foreground">This source text is retained for audit, even if the update is later rejected.</p>
                </div>

                <div className="grid content-start gap-4">
                  <div className="grid gap-1.5">
                    <label htmlFor="entryType" className="text-sm font-medium">Update type</label>
                    <select id="entryType" name="entryType" defaultValue="COMPLETION" className={selectClassName}>
                      {teamEntryTypes.map((type) => <option key={type} value={type}>{entryTypeLabels[type]}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <label htmlFor="teamId" className="text-sm font-medium">Team</label>
                    <select id="teamId" name="teamId" required value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)} className={selectClassName}>
                      <option value="">Choose team</option>
                      {teams.map((team) => <option key={team.id} value={team.id}>{team.name}{team.region ? ` - ${team.region}` : ""}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <label htmlFor="submittedByMemberId" className="text-sm font-medium">Submitted by <span className="font-normal text-muted-foreground">(optional)</span></label>
                    <select id="submittedByMemberId" name="submittedByMemberId" disabled={!selectedTeamId || !availableMembers.length} className={selectClassName}>
                      <option value="">{selectedTeamId ? "Not specified" : "Choose a team first"}</option>
                      {availableMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <label htmlFor="jobId" className="text-sm font-medium">Related job <span className="font-normal text-muted-foreground">(optional)</span></label>
                    <select id="jobId" name="jobId" disabled={!selectedTeamId} className={selectClassName}>
                      <option value="">{selectedTeamId ? "No linked job" : "Choose a team first"}</option>
                      {availableJobs.map((job) => <option key={job.id} value={job.id}>{job.customerName} - {job.serviceType.toLowerCase()}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <label htmlFor="entryDate" className="text-sm font-medium">Update date</label>
                    <input id="entryDate" name="entryDate" type="date" required defaultValue={entryDate} className={inputClassName} />
                  </div>
                </div>

                <div className="grid gap-2 xl:col-span-2">
                  <label htmlFor="notes" className="text-sm font-medium">Operator note <span className="font-normal text-muted-foreground">(optional)</span></label>
                  <Textarea id="notes" name="notes" maxLength={2000} className="min-h-20 resize-y" placeholder="Add context for the reviewer. Do not paraphrase over the original message." />
                </div>
                {state.error ? <p role="alert" className="xl:col-span-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p> : null}
                {state.success ? <p role="status" className="xl:col-span-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-300">{state.success}</p> : null}
                <div className="xl:col-span-2 flex justify-end">
                  <Button type="submit" size="lg" disabled={isPending}>
                    <FileTextIcon data-icon="inline-start" />
                    {isPending ? "Saving update..." : "Save for review"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <EmptyTeamsNotice />
        )
      ) : null}

      <section className="grid gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Review queue</h2>
            <p className="mt-1 text-sm text-muted-foreground">The 30 most recent team-submitted entries, including the operator audit trail.</p>
          </div>
          <Badge variant="outline" className={pendingCount ? reviewStyles.PENDING : ""}>{pendingCount} pending</Badge>
        </div>
        {entries.length ? <EntryTable entries={entries} canEdit={canEdit} /> : <EmptyEntriesNotice />}
      </section>
    </div>
  );
}

function EntryTable({ entries, canEdit }: { entries: Entry[]; canEdit: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b bg-muted/45 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <tr><th className="px-4 py-3">Update</th><th className="px-4 py-3">Team / job</th><th className="px-4 py-3">Submitted / entered</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Review</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map((entry) => (
              <tr key={entry.id} className="align-top hover:bg-muted/30">
                <td className="max-w-sm px-4 py-3">
                  <div className="flex items-center gap-2"><MessageSquareTextIcon className="size-4 shrink-0 text-muted-foreground" /><span className="font-medium">{entryTypeLabels[entry.entryType as keyof typeof entryTypeLabels] ?? entry.entryType}</span></div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{entry.rawWhatsAppText}</p>
                  {entry.notes ? <p className="mt-2 text-xs text-foreground/80">Note: {entry.notes}</p> : null}
                </td>
                <td className="px-4 py-3"><p className="font-medium">{entry.teamName}</p><p className="mt-1 text-xs text-muted-foreground">{entry.jobLabel ?? "No linked job"}</p></td>
                <td className="px-4 py-3"><p>{entry.memberName ?? "Team sender not specified"}</p><p className="mt-1 text-xs text-muted-foreground">Entered by {entry.operatorName ?? "Unknown operator"}</p></td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatEntryDate(entry.entryDate)}</td>
                <td className="px-4 py-3"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className={reviewStyles[entry.reviewStatus]}>{capitalize(entry.reviewStatus)}</Badge>{canEdit && entry.reviewStatus === "PENDING" ? <ReviewButtons entryId={entry.id} /> : null}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReviewButtons({ entryId }: { entryId: string }) {
  return (
    <form action={reviewTeamEntry} className="flex items-center gap-1">
      <input type="hidden" name="entryId" value={entryId} />
      <Button type="submit" name="reviewStatus" value="APPROVED" size="sm" variant="outline" title="Approve update"><CheckIcon />Approve</Button>
      <Button type="submit" name="reviewStatus" value="REJECTED" size="sm" variant="ghost" className="text-destructive hover:text-destructive" title="Reject update"><XIcon />Reject</Button>
    </form>
  );
}

function EmptyTeamsNotice() {
  return <div className="grid gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-5 py-8 text-center"><p className="font-medium">No active teams are configured yet.</p><p className="mx-auto max-w-xl text-sm text-muted-foreground">Team updates are intentionally blocked until an active team exists, so every entry keeps a reliable owner and audit trail.</p><div><Link href="/team-setup" className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted">Set up teams</Link></div></div>;
}

function EmptyEntriesNotice() {
  return <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-border bg-muted/20 px-5 text-center"><p className="text-sm text-muted-foreground">No team updates have been recorded yet.</p></div>;
}

function capitalize(value: string) { return `${value.slice(0, 1)}${value.slice(1).toLowerCase()}`; }
function formatEntryDate(value: string) { return new Intl.DateTimeFormat("en-MY", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)); }

const inputClassName = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";
const selectClassName = inputClassName;
