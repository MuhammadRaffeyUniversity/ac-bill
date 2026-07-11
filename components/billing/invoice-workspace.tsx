"use client";

import { useActionState, useState } from "react";
import { PlusIcon, ReceiptTextIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/form-select";
import { SelectItem } from "@/components/ui/select";
import { createInvoice, initialBillingActionState, recordPayments } from "@/src/lib/billing/actions";

type CompletedJob = { id: string; customer: string; serviceType: string; requestedAt: string | null };
type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  paid: number;
  customer: string;
  serviceType: string;
  issuedAt: string | null;
};

const controlClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";
const newLine = () => ({ id: crypto.randomUUID(), description: "Service", quantity: 1, unitPrice: 0 });
const newPayment = () => ({ id: crypto.randomUUID(), method: "CASH", amount: 0, collectedByTeam: true, referenceNumber: "", notes: "" });

export function InvoiceWorkspace({ completedJobs, invoices }: { completedJobs: CompletedJob[]; invoices: Invoice[] }) {
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"><InvoiceCreator jobs={completedJobs} /><InvoiceList invoices={invoices} /></div>;
}

function InvoiceCreator({ jobs }: { jobs: CompletedJob[] }) {
  const [state, formAction, isPending] = useActionState(createInvoice, initialBillingActionState);
  const [items, setItems] = useState([newLine()]);
  const updateLine = (id: string, key: "description" | "quantity" | "unitPrice", value: string) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [key]: key === "description" ? value : Number(value) } : item));
  };
  const estimate = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return <Card className="h-fit"><CardHeader><CardTitle>Create invoice</CardTitle><CardDescription>Only completed work can be invoiced. Add the agreed service lines before issuing.</CardDescription></CardHeader><CardContent>{jobs.length ? <form action={formAction} className="grid gap-4"><label className="grid gap-1.5 text-sm font-medium">Completed job<FormSelect name="jobId" required defaultValue="" placeholder="Select completed job"><SelectItem value="">Select completed job</SelectItem>{jobs.map((job) => <SelectItem key={job.id} value={job.id}>{job.customer} - {job.serviceType.toLowerCase()}</SelectItem>)}</FormSelect></label><div className="grid gap-2"><p className="text-sm font-medium">Invoice items</p>{items.map((item, index) => <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_72px_94px_32px] gap-2"><input aria-label={`Item ${index + 1} description`} value={item.description} onChange={(event) => updateLine(item.id, "description", event.target.value)} className={controlClass} /><input aria-label={`Item ${index + 1} quantity`} type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateLine(item.id, "quantity", event.target.value)} className={controlClass} /><input aria-label={`Item ${index + 1} price`} type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => updateLine(item.id, "unitPrice", event.target.value)} className={controlClass} /><Button type="button" variant="ghost" size="icon" aria-label={`Remove item ${index + 1}`} disabled={items.length === 1} onClick={() => setItems((current) => current.filter((line) => line.id !== item.id))}><Trash2Icon /></Button></div>)}<Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setItems((current) => [...current, newLine()])}><PlusIcon data-icon="inline-start" />Add line</Button></div><input type="hidden" name="items" value={JSON.stringify(items.map(({ id: _, ...item }) => item))} /><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Discount<input name="discount" type="number" min="0" step="0.01" defaultValue="0" className={controlClass} /></label><label className="grid gap-1.5 text-sm font-medium">Tax<input name="tax" type="number" min="0" step="0.01" defaultValue="0" className={controlClass} /></label></div><label className="grid gap-1.5 text-sm font-medium">Due date <span className="font-normal text-muted-foreground">(optional)</span><input name="dueAt" type="date" className={controlClass} /></label><p className="text-sm text-muted-foreground">Line estimate: RM {estimate.toFixed(2)}</p><ActionNotice state={state} /><Button type="submit" disabled={isPending}><ReceiptTextIcon data-icon="inline-start" />{isPending ? "Issuing invoice..." : "Issue invoice"}</Button></form> : <p className="text-sm text-muted-foreground">There are no completed, uninvoiced jobs yet.</p>}</CardContent></Card>;
}

function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  return <Card><CardHeader><CardTitle>Issued invoices</CardTitle><CardDescription>Record payment rows separately for cash, online transfers, card, or mixed settlement.</CardDescription></CardHeader><CardContent>{invoices.length ? <div className="grid gap-3">{invoices.map((invoice) => <InvoiceRow key={invoice.id} invoice={invoice} />)}</div> : <p className="text-sm text-muted-foreground">Issued invoices will appear here.</p>}</CardContent></Card>;
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const [expanded, setExpanded] = useState(false);
  const [state, formAction, isPending] = useActionState(recordPayments, initialBillingActionState);
  const [payments, setPayments] = useState([newPayment()]);
  const balance = Math.max(0, invoice.total - invoice.paid);
  const updatePayment = (id: string, key: "method" | "amount" | "collectedByTeam" | "referenceNumber" | "notes", value: string | boolean) => {
    setPayments((current) => current.map((payment) => payment.id === id ? { ...payment, [key]: key === "amount" ? Number(value) : value } : payment));
  };

  return <div className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{invoice.invoiceNumber}</p><p className="mt-1 text-sm text-muted-foreground">{invoice.customer} · {invoice.serviceType.toLowerCase()}</p></div><div className="text-right"><p className="font-medium">RM {invoice.total.toFixed(2)}</p><p className="mt-1 text-xs text-muted-foreground">{invoice.status.replaceAll("_", " ")} · RM {balance.toFixed(2)} due</p></div></div><div className="mt-3 flex flex-wrap gap-2"><a className="inline-flex h-8 items-center rounded-lg border px-2.5 text-sm font-medium hover:bg-muted" href={`/invoices/${invoice.id}`}>Open / print</a>{balance > 0 ? <Button type="button" variant="outline" size="sm" onClick={() => setExpanded((value) => !value)}>{expanded ? "Close payment" : "Record payment"}</Button> : null}</div>{expanded ? <form action={formAction} className="mt-4 grid gap-3 border-t pt-4"><input type="hidden" name="invoiceId" value={invoice.id} />{payments.map((payment, index) => <div key={payment.id} className="grid gap-2 rounded-md bg-muted/40 p-3 sm:grid-cols-[120px_110px_1fr_auto]"><FormSelect name={`paymentMethod-${payment.id}`} value={payment.method} onValueChange={(value) => updatePayment(payment.id, "method", value ?? "CASH")} placeholder={`Payment ${index + 1} method`}><SelectItem value="CASH">Cash</SelectItem><SelectItem value="ONLINE">Online</SelectItem><SelectItem value="CARD">Card</SelectItem><SelectItem value="OTHER">Other</SelectItem></FormSelect><input aria-label={`Payment ${index + 1} amount`} type="number" min="0.01" step="0.01" value={payment.amount} onChange={(event) => updatePayment(payment.id, "amount", event.target.value)} className={controlClass} /><input aria-label={`Payment ${index + 1} reference`} placeholder="Reference / note" value={payment.referenceNumber} onChange={(event) => updatePayment(payment.id, "referenceNumber", event.target.value)} className={controlClass} /><div className="flex items-center gap-2"><label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={payment.collectedByTeam} onChange={(event) => updatePayment(payment.id, "collectedByTeam", event.target.checked)} />Team collected</label><Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove payment ${index + 1}`} disabled={payments.length === 1} onClick={() => setPayments((current) => current.filter((line) => line.id !== payment.id))}><Trash2Icon /></Button></div></div>)}<input type="hidden" name="payments" value={JSON.stringify(payments.map(({ id: _, ...payment }) => payment))} /><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" onClick={() => setPayments((current) => [...current, newPayment()])}><PlusIcon data-icon="inline-start" />Split payment</Button><Button type="submit" size="sm" disabled={isPending}>{isPending ? "Saving..." : "Save payment"}</Button></div><ActionNotice state={state} /></form> : null}</div>;
}

function ActionNotice({ state }: { state: { error?: string; success?: string } }) {
  if (state.error) return <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>;
  if (state.success) return <p role="status" className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p>;
  return null;
}
