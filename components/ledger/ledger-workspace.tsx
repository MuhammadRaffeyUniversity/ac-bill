"use client";

import { useActionState } from "react";
import { BanknoteArrowDownIcon, BanknoteArrowUpIcon, LandmarkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createCompanyExpense, createPersonalExpense, createPettyCashEntry, type LedgerActionState } from "@/src/lib/ledger/actions";

type Expense = { id: string; date: string; category: string | null; amount: number };
type CashEntry = { id: string; date: string; cashIn: number; cashOut: number; balanceAfter: number; sourceType: string | null; note: string | null };

export function LedgerWorkspace({ entryDate, companyExpenses, personalExpenses, pettyCashEntries }: { entryDate: string; companyExpenses: Expense[]; personalExpenses: Expense[]; pettyCashEntries: CashEntry[] }) {
  return <div className="grid gap-6 xl:grid-cols-3">
    <ExpenseCard title="Company expenses" description="Operating costs that may affect company reporting." icon={LandmarkIcon} action={createCompanyExpense} entryDate={entryDate} categoryPlaceholder="Rent, supplies, utilities" categoryRequired entries={companyExpenses} submitLabel="Save company expense" />
    <ExpenseCard title="Personal expenses" description="Owner spending kept outside company profit." icon={BanknoteArrowDownIcon} action={createPersonalExpense} entryDate={entryDate} categoryPlaceholder="Optional category" entries={personalExpenses} submitLabel="Save personal expense" />
    <PettyCashCard entryDate={entryDate} entries={pettyCashEntries} />
  </div>;
}

function ExpenseCard({ title, description, icon: Icon, action, entryDate, categoryPlaceholder, categoryRequired, entries, submitLabel }: { title: string; description: string; icon: typeof LandmarkIcon; action: typeof createCompanyExpense; entryDate: string; categoryPlaceholder: string; categoryRequired?: boolean; entries: Expense[]; submitLabel: string }) {
  const [state, formAction, isPending] = useActionState(action, initialLedgerActionState);
  return <Card className="h-fit"><CardHeader><Icon className="mb-2 size-5 text-primary" /><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent className="grid gap-5"><form action={formAction} className="grid gap-3">
    <Field label="Date"><input name="date" type="date" defaultValue={entryDate} required className={controlClass} /></Field>
    <Field label="Amount (MYR)"><input name="amount" type="number" min="0.01" step="0.01" required className={controlClass} /></Field>
    <Field label="Category"><input name="category" required={categoryRequired} maxLength={100} placeholder={categoryPlaceholder} className={controlClass} /></Field>
    {title === "Company expenses" ? <Field label="Payment method"><select name="paymentMethod" className={controlClass}><option value="">Not recorded</option><option value="CASH">Cash</option><option value="ONLINE">Online</option><option value="CARD">Card</option><option value="OTHER">Other</option></select></Field> : null}
    <Field label="Description"><textarea name="description" maxLength={1000} className={`${controlClass} min-h-16 resize-y`} /></Field>
    <Field label="Note"><textarea name="notes" maxLength={2000} className={`${controlClass} min-h-16 resize-y`} /></Field>
    <Notice state={state} /><Button type="submit" disabled={isPending}>{isPending ? "Saving..." : submitLabel}</Button>
  </form><EntryList entries={entries.map((entry) => `${entry.date} · ${entry.category ?? "Uncategorized"} · RM ${entry.amount.toFixed(2)}`)} emptyMessage={`No ${title.toLowerCase()} recorded yet.`} /></CardContent></Card>;
}

function PettyCashCard({ entryDate, entries }: { entryDate: string; entries: CashEntry[] }) {
  const [state, formAction, isPending] = useActionState(createPettyCashEntry, initialLedgerActionState);
  const latestBalance = entries[0]?.balanceAfter ?? 0;
  return <Card className="h-fit"><CardHeader><BanknoteArrowUpIcon className="mb-2 size-5 text-primary" /><CardTitle>Petty cash</CardTitle><CardDescription>Current recorded balance: RM {latestBalance.toFixed(2)}</CardDescription></CardHeader><CardContent className="grid gap-5"><form action={formAction} className="grid gap-3">
    <Field label="Date"><input name="date" type="date" defaultValue={entryDate} required className={controlClass} /></Field>
    <Field label="Direction"><select name="direction" className={controlClass}><option value="IN">Cash in</option><option value="OUT">Cash out</option></select></Field>
    <Field label="Amount (MYR)"><input name="amount" type="number" min="0.01" step="0.01" required className={controlClass} /></Field>
    <Field label="Source type"><input name="sourceType" maxLength={100} placeholder="Float, reimbursement, purchase" className={controlClass} /></Field>
    <Field label="Note"><textarea name="note" maxLength={2000} className={`${controlClass} min-h-16 resize-y`} /></Field>
    <Notice state={state} /><Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Record cash movement"}</Button>
  </form><EntryList entries={entries.map((entry) => `${entry.date} · ${entry.cashIn ? `+RM ${entry.cashIn.toFixed(2)}` : `-RM ${entry.cashOut.toFixed(2)}`} · Balance RM ${entry.balanceAfter.toFixed(2)}`)} emptyMessage="No petty-cash movements recorded yet." /></CardContent></Card>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-sm"><span className="font-medium">{label}</span>{children}</label>; }
function Notice({ state }: { state: { error?: string; success?: string } }) { return state.error ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p> : state.success ? <p role="status" className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p> : null; }
function EntryList({ entries, emptyMessage }: { entries: string[]; emptyMessage: string }) { return entries.length ? <div className="grid gap-2 border-t pt-4 text-sm">{entries.slice(0, 8).map((entry) => <p key={entry} className="text-muted-foreground">{entry}</p>)}</div> : <p className="border-t pt-4 text-sm text-muted-foreground">{emptyMessage}</p>; }
const controlClass = "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";
const initialLedgerActionState: LedgerActionState = {};
