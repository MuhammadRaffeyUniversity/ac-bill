"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { SelectItem } from "@/components/ui/select";
import { saveTeamReportAndCloseout, type JobFlowActionState } from "@/src/lib/job-flow/actions";
import { getSubmittedPayments, paymentRowsRequired, type ReportPayment, type ReportPaymentStatus } from "./payment-state";

const newPayment = (id: string): ReportPayment => ({
  id, method: "CASH", amount: 0, collectedByTeam: true, referenceNumber: "", notes: "",
});

export function ReportStage({ jobId, updatedAt, members, cancelled = false }: { jobId: string; updatedAt: string; members: Array<{ id: string; name: string }>; cancelled?: boolean }) {
  const [state, action, pending] = useActionState(saveTeamReportAndCloseout, {} as JobFlowActionState);
  const [paymentStatus, setPaymentStatus] = useState<ReportPaymentStatus>("PAID");
  const [payments, setPayments] = useState<ReportPayment[]>([newPayment("payment-1")]);
  const paymentSequence = useRef(1);

  if (cancelled) return <section className="rounded-xl border bg-card p-5"><h2 className="text-xl font-semibold">Job cancelled</h2><p className="mt-2 text-sm text-muted-foreground">This terminal job cannot advance to invoice.</p></section>;

  const updatePayment = (id: string, patch: Partial<ReportPayment>) => setPayments((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  const hasPaymentRows = paymentRowsRequired(paymentStatus);

  return <section className="rounded-xl border bg-card p-5">
    <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Stage 3 of 5</p>
    <h2 className="mt-1 text-xl font-semibold">Record the team report</h2>
    <p className="mt-1 text-sm text-muted-foreground">Paste the original WhatsApp update when available and confirm every value manually. No AI is used for completion.</p>
    <form action={action} className="mt-5 grid gap-5 lg:grid-cols-2">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="expectedUpdatedAt" value={updatedAt} />
      <input type="hidden" name="entryDate" value={new Date().toISOString().slice(0, 10)} />
      <div>
        <label className="grid gap-1.5 text-sm font-medium">Original WhatsApp update <span className="font-normal text-muted-foreground">(optional)</span><textarea name="rawWhatsAppText" className="min-h-56 rounded-md border bg-background p-3 font-mono text-sm" /></label>
        <label className="mt-4 grid gap-1.5 text-sm font-medium">Reporting team member <span className="font-normal text-muted-foreground">(optional)</span><FormSelect name="submittedByMemberId" placeholder="Choose the person who reported"><SelectItem value="">Not specified</SelectItem>{members.map((member) => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}</FormSelect></label>
        <label className="mt-4 grid gap-1.5 text-sm font-medium">Closeout note <span className="font-normal text-muted-foreground">(optional)</span><textarea name="note" maxLength={2000} className="min-h-24 rounded-md border bg-background p-3 text-sm" /></label>
      </div>
      <div className="grid content-start gap-3">
        <label className="grid gap-1.5 text-sm font-medium">Work outcome<FormSelect name="performed" defaultValue="YES" placeholder="Choose work outcome"><SelectItem value="YES">Yes, performed</SelectItem><SelectItem value="NO">No, not performed</SelectItem></FormSelect></label>
        <label className="grid gap-1.5 text-sm font-medium">Job outcome<FormSelect name="status" defaultValue="COMPLETED" placeholder="Choose job outcome"><SelectItem value="COMPLETED">Completed</SelectItem><SelectItem value="POSTPONED">Postponed</SelectItem><SelectItem value="CANCELLED">Cancelled</SelectItem></FormSelect></label>
        <label className="grid gap-1.5 text-sm font-medium">Service amount (RM)<input name="completedAmount" type="number" min="0" step="0.01" required className="h-9 rounded-md border bg-background px-3" /></label>
        <label className="grid gap-1.5 text-sm font-medium">Payment outcome<FormSelect name="paymentStatus" value={paymentStatus} onValueChange={(value) => setPaymentStatus((value ?? "PAID") as ReportPaymentStatus)} placeholder="Choose payment outcome"><SelectItem value="PAID">Paid</SelectItem><SelectItem value="PARTIALLY_PAID">Partially paid</SelectItem><SelectItem value="UNPAID">Unpaid</SelectItem><SelectItem value="NO_CHARGE">No charge</SelectItem><SelectItem value="CANCELLED">Cancelled</SelectItem></FormSelect></label>
        <div className="grid gap-2">
          <p className="text-sm font-medium">Payment rows</p>
          {hasPaymentRows ? payments.map((payment, index) => <div key={payment.id} className="grid gap-2 rounded-lg border bg-background/60 p-3">
            <div className="grid grid-cols-[1fr_110px_36px] gap-2">
              <FormSelect name={`display-payment-method-${payment.id}`} placeholder="Method" value={payment.method} onValueChange={(value) => { const method = (value ?? "CASH") as ReportPayment["method"]; updatePayment(payment.id, { method, collectedByTeam: method === "CASH" }); }}><SelectItem value="CASH">Cash</SelectItem><SelectItem value="ONLINE">Online</SelectItem><SelectItem value="CARD">Card</SelectItem><SelectItem value="OTHER">Other</SelectItem></FormSelect>
              <input aria-label={`Payment ${index + 1} amount`} type="number" min="0" step="0.01" value={payment.amount} onChange={(event) => updatePayment(payment.id, { amount: Number(event.target.value) })} className="h-9 rounded-md border bg-background px-2" />
              <Button aria-label={`Remove payment ${index + 1}`} type="button" variant="ghost" size="icon" disabled={payments.length === 1} onClick={() => setPayments((current) => current.filter((item) => item.id !== payment.id))}><Trash2Icon /></Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
              <label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" checked={payment.collectedByTeam} onChange={(event) => updatePayment(payment.id, { collectedByTeam: event.target.checked })} />Collected by team</label>
              <input aria-label={`Payment ${index + 1} reference`} value={payment.referenceNumber} onChange={(event) => updatePayment(payment.id, { referenceNumber: event.target.value })} className="h-8 rounded-md border bg-background px-2 text-xs" placeholder="Online/card reference (optional)" />
            </div>
          </div>) : <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">No payment rows will be recorded for this outcome.</p>}
          <input type="hidden" name="payments" value={JSON.stringify(getSubmittedPayments(paymentStatus, payments))} />
          {hasPaymentRows ? <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => { paymentSequence.current += 1; setPayments((current) => [...current, newPayment(`payment-${paymentSequence.current}`)]); }}><PlusIcon data-icon="inline-start" />Split payment</Button> : null}
        </div>
        {state.error ? <p role="alert" className="text-sm text-destructive">{state.error}</p> : null}
        {state.jobId ? <Link className="text-sm font-medium text-primary underline" href={`/jobs?job=${encodeURIComponent(state.jobId)}`}>Continue to invoice</Link> : null}
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save & continue to invoice"}</Button>
      </div>
    </form>
  </section>;
}
