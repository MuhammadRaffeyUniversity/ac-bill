"use client";

import { useActionState } from "react";
import { CircleCheckBigIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/form-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { closeoutJob, type OperationActionState } from "@/src/lib/operations/actions";
import { getInvoiceHandoffPath } from "@/src/lib/operations/closeout-handoff";

type Job = { id: string; customer: string; address: string; serviceType: string; status: string; paymentStatus: string; team: string | null };

export function JobsWorkspace({ jobs, canCloseout, readOnlyMessage }: { jobs: Job[]; canCloseout: boolean; readOnlyMessage?: string }) {
  const [state, formAction, isPending] = useActionState(closeoutJob, initialOperationActionState);
  const openJobs = jobs.filter((job) => !["COMPLETED", "CANCELLED"].includes(job.status));

  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
    <Card><CardHeader><CardTitle>Jobs</CardTitle><CardDescription>Customer details, service state, payment outcome, and assigned team.</CardDescription></CardHeader><CardContent>{jobs.length ? <div className="divide-y rounded-lg border">{jobs.map((job) => <div key={job.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"><div><p className="font-medium">{job.customer}</p><p className="mt-1 text-xs text-muted-foreground">{job.serviceType.toLowerCase()} - {job.address}</p><p className="mt-1 text-xs text-muted-foreground">Team: {job.team ?? "Unassigned"}</p></div><div className="flex gap-2"><Badge variant="outline">{job.status.replace("_", " ")}</Badge><Badge variant="secondary">{job.paymentStatus.replaceAll("_", " ")}</Badge></div></div>)}</div> : <p className="text-sm text-muted-foreground">No jobs have been created yet.</p>}</CardContent></Card>
    <Card className="h-fit"><CardHeader><CardTitle>{canCloseout ? "Record closeout" : "Worklist access"}</CardTitle><CardDescription>{canCloseout ? "A completion cannot be saved without work and payment outcomes." : "This view is read-only for your role."}</CardDescription></CardHeader><CardContent>{canCloseout && jobs.length ? <form action={formAction} className="grid gap-4">
      <Field label="Job"><FormSelect name="jobId" placeholder="Choose job" required labelForValue={(value) => openJobs.find((job) => job.id === value) ? `${openJobs.find((job) => job.id === value)!.customer} - ${openJobs.find((job) => job.id === value)!.serviceType.toLowerCase()}` : "Choose job"}><SelectItem value="">Choose job</SelectItem>{openJobs.map((job) => <SelectItem key={job.id} value={job.id}>{job.customer} - {job.serviceType.toLowerCase()}</SelectItem>)}</FormSelect></Field>
      <Field label="Was the work performed?"><ThemedSelect name="performed" placeholder="Choose outcome" required><SelectItem value="">Choose outcome</SelectItem><SelectItem value="YES">Yes, work performed</SelectItem><SelectItem value="NO">No, not performed</SelectItem></ThemedSelect></Field>
      <Field label="Job status"><ThemedSelect name="status" defaultValue="COMPLETED" placeholder="Choose status" required><SelectItem value="COMPLETED">Completed</SelectItem><SelectItem value="POSTPONED">Postponed</SelectItem><SelectItem value="CANCELLED">Cancelled</SelectItem></ThemedSelect></Field>
      <Field label="Payment outcome"><ThemedSelect name="paymentStatus" placeholder="Choose outcome" required><SelectItem value="">Choose outcome</SelectItem><SelectItem value="PAID">Paid</SelectItem><SelectItem value="PARTIALLY_PAID">Partially paid</SelectItem><SelectItem value="UNPAID">Unpaid</SelectItem><SelectItem value="NO_CHARGE">No charge</SelectItem><SelectItem value="CANCELLED">Cancelled / no charge</SelectItem></ThemedSelect></Field>
      <Field label="Closeout note"><textarea name="note" required maxLength={2000} className={`${controlClass} min-h-24 resize-y`} placeholder="Work completed, payment handling, or reason for postponement/cancellation" /></Field>
      <Notice state={state} />
      {state.invoiceJobId ? <Link href={getInvoiceHandoffPath(state.invoiceJobId, "COMPLETED")!} className="inline-flex min-h-10 items-center justify-center rounded-md border border-primary bg-primary/5 px-3 text-sm font-medium text-primary hover:bg-primary/10">Continue: add amount and payment</Link> : null}
      <Button type="submit" disabled={isPending}><CircleCheckBigIcon data-icon="inline-start" />{isPending ? "Saving closeout..." : "Record closeout"}</Button>
    </form> : <p className="text-sm text-muted-foreground">{readOnlyMessage ?? (canCloseout ? "No open jobs are available for closeout." : "This role can review job records but cannot record a closeout.")}</p>}</CardContent></Card>
  </div>;
}

function ThemedSelect({ children, defaultValue, name, placeholder, required = false }: { children: React.ReactNode; defaultValue?: string; name: string; placeholder: string; required?: boolean }) {
  return <Select name={name} defaultValue={defaultValue} required={required}><SelectTrigger className="w-full"><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{children}</SelectContent></Select>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-sm"><span className="font-medium">{label}</span>{children}</label>; }
function Notice({ state }: { state: { error?: string; success?: string } }) { return state.error ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p> : state.success ? <p role="status" className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p> : null; }
const controlClass = "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";
const initialOperationActionState: OperationActionState = {};
