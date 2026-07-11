"use client";

import { useActionState } from "react";
import { ReceiptTextIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/form-select";
import { SelectItem } from "@/components/ui/select";
import { createTeamExpense, type OperationActionState } from "@/src/lib/operations/actions";

type Team = { id: string; name: string };
type Job = { id: string; customer: string; assignedTeamId: string | null };
type Expense = { id: string; category: string; team: string; amount: string; date: string; approved: boolean };

export function ExpensesWorkspace({ teams, jobs, expenses, entryDate }: { teams: Team[]; jobs: Job[]; expenses: Expense[]; entryDate: string }) {
  const [state, formAction, isPending] = useActionState(createTeamExpense, initialOperationActionState);
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]"><Card><CardHeader><CardTitle>Team expenses</CardTitle><CardDescription>Only operational team expenses are captured here; company and personal expenses remain separate.</CardDescription></CardHeader><CardContent>{expenses.length ? <div className="divide-y rounded-lg border">{expenses.map((expense) => <div key={expense.id} className="flex items-center justify-between gap-3 px-4 py-3"><div><p className="font-medium">{expense.category}</p><p className="mt-1 text-xs text-muted-foreground">{expense.team} - {expense.date}</p></div><div className="text-right"><p className="font-medium">MYR {expense.amount}</p><Badge variant="outline">{expense.approved ? "Approved" : "Pending"}</Badge></div></div>)}</div> : <p className="text-sm text-muted-foreground">No team expenses recorded yet.</p>}</CardContent></Card><Card className="h-fit"><CardHeader><CardTitle>Record team expense</CardTitle><CardDescription>New entries are pending approval and never mix into personal expenses.</CardDescription></CardHeader><CardContent>{teams.length ? <form action={formAction} className="grid gap-4"><Field label="Team"><FormSelect name="teamId" placeholder="Choose team" required><SelectItem value="">Choose team</SelectItem>{teams.map((team) => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}</FormSelect></Field><Field label="Related job (optional)"><FormSelect name="jobId" placeholder="No linked job"><SelectItem value="">No linked job</SelectItem>{jobs.map((job) => <SelectItem key={job.id} value={job.id}>{job.customer}</SelectItem>)}</FormSelect></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Date"><input name="date" type="date" defaultValue={entryDate} required className={controlClass} /></Field><Field label="Amount (MYR)"><input name="amount" type="number" min="0.01" step="0.01" required className={controlClass} /></Field></div><Field label="Category"><input name="category" required maxLength={100} placeholder="Petrol, parking, supplies" className={controlClass} /></Field><Field label="Paid by"><FormSelect name="paidBy" defaultValue="TEAM" placeholder="Select payer"><SelectItem value="TEAM">Team</SelectItem><SelectItem value="MEMBER">Team member</SelectItem><SelectItem value="COMPANY">Company</SelectItem><SelectItem value="PARTNER">Partner</SelectItem><SelectItem value="OWNER">Owner</SelectItem></FormSelect></Field><Field label="Description"><textarea name="description" maxLength={1000} className={`${controlClass} min-h-20 resize-y`} /></Field><Notice state={state} /><Button type="submit" disabled={isPending}><ReceiptTextIcon data-icon="inline-start" />{isPending ? "Saving expense..." : "Save team expense"}</Button></form> : <p className="text-sm text-muted-foreground">No active teams are configured yet.</p>}</CardContent></Card></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-sm"><span className="font-medium">{label}</span>{children}</label>; }
function Notice({ state }: { state: { error?: string; success?: string } }) { return state.error ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p> : state.success ? <p role="status" className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p> : null; }
const controlClass = "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";
const initialOperationActionState: OperationActionState = {};
