"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createInvoiceWithPayments, type BillingActionState } from "@/src/lib/billing/actions";

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

const controlClass = "h-9 rounded-md border bg-background px-3";

function newInvoiceItem(id: string, unitPrice = 0): InvoiceItem {
  return { id, description: "AC service", quantity: 1, unitPrice };
}

export function InvoiceStage({ jobId, amount, payments }: { jobId: string; amount: number; payments: Array<{ method: string; amount: number; collectedByTeam: boolean; referenceNumber?: string; notes?: string }> }) {
  const [state, action, pending] = useActionState(createInvoiceWithPayments, {} as BillingActionState);
  const [items, setItems] = useState<InvoiceItem[]>([newInvoiceItem("item-1", amount)]);
  const itemSequence = useRef(1);
  const estimate = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  function updateItem(id: string, patch: Partial<InvoiceItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  return <section className="rounded-xl border bg-card p-5">
    <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Stage 4 of 5</p>
    <h2 className="mt-1 text-xl font-semibold">Create invoice and payment</h2>
    <p className="mt-1 text-sm text-muted-foreground">The team report pre-fills this invoice. Review it before issuing.</p>
    <form action={action} className="mt-5 grid max-w-3xl gap-4">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="items" value={JSON.stringify(items.map((item) => ({ description: item.description, quantity: item.quantity, unitPrice: item.unitPrice })))} />
      <input type="hidden" name="payments" value={JSON.stringify(payments)} />
      <div className="grid gap-2">
        <p className="text-sm font-medium">Invoice items</p>
        {items.map((item, index) => <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_72px_110px_36px] gap-2">
          <input aria-label={`Item ${index + 1} description`} value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} className={controlClass} />
          <input aria-label={`Item ${index + 1} quantity`} type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) })} className={controlClass} />
          <input aria-label={`Item ${index + 1} price`} type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => updateItem(item.id, { unitPrice: Number(event.target.value) })} className={controlClass} />
          <Button aria-label={`Remove item ${index + 1}`} type="button" variant="ghost" size="icon" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((line) => line.id !== item.id))}><Trash2Icon /></Button>
        </div>)}
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => { itemSequence.current += 1; setItems((current) => [...current, newInvoiceItem(`item-${itemSequence.current}`)]); }}><PlusIcon data-icon="inline-start" />Add line</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">Discount<input name="discount" type="number" min="0" step="0.01" defaultValue="0" className={controlClass} /></label>
        <label className="grid gap-1.5 text-sm font-medium">Tax<input name="tax" type="number" min="0" step="0.01" defaultValue="0" className={controlClass} /></label>
      </div>
      <label className="grid gap-1.5 text-sm font-medium">Due date <span className="font-normal text-muted-foreground">(optional)</span><input name="dueAt" type="date" className={controlClass} /></label>
      <p className="text-sm text-muted-foreground">Line estimate: RM {estimate.toFixed(2)}</p>
      {state.error ? <p role="alert" className="text-sm text-destructive">{state.error}</p> : null}
      {state.jobId ? <Link className="text-sm font-medium text-primary underline" href={`/jobs?job=${encodeURIComponent(state.jobId)}`}>Continue to customer handoff</Link> : null}
      <Button type="submit" disabled={pending}>{pending ? "Issuing…" : "Issue invoice & continue"}</Button>
    </form>
  </section>;
}
