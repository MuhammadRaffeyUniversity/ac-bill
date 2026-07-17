"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertTriangleIcon, BanknoteIcon, CheckCircle2Icon, HandCoinsIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { recordFullPayout, type PayoutActionState } from "@/src/lib/payouts/actions";
import type { PayoutWorkspaceData } from "@/src/lib/payouts/workspace";

const initialActionState: PayoutActionState = {};
const money = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });
const date = new Intl.DateTimeFormat("en-MY", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" });

export function PayoutWorkspace({ data }: { data: PayoutWorkspaceData }) {
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const teams = useMemo(() => [...new Set(data.obligations.map((row) => row.teamName))], [data.obligations]);
  const rows = data.obligations.filter((row) =>
    (typeFilter === "ALL" || row.type === typeFilter)
    && (teamFilter === "ALL" || row.teamName === teamFilter)
    && (statusFilter === "ALL" || row.status === statusFilter),
  );

  return (
    <div className="mx-auto grid max-w-[1500px] gap-6">
      <header className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground"><HandCoinsIcon className="size-5" /></div>
          <h2 className="text-2xl font-semibold">Team payouts</h2>
          <p className="mt-1 text-sm text-muted-foreground">Salary and earned commission are owed to individual members. Every payment settles one obligation in full and keeps an audit trail.</p>
        </div>
        <form method="get" className="flex items-end gap-2">
          <label className="grid gap-1.5 text-sm font-medium">Payout month<Input type="month" name="month" defaultValue={data.periodKey} className="w-44" /></label>
          <Button type="submit" variant="outline">View month</Button>
        </form>
      </header>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Payout totals">
        <SummaryCard label="Salary due" value={data.summary.salaryDue} tone="due" />
        <SummaryCard label="Salary paid" value={data.summary.salaryPaid} tone="paid" />
        <SummaryCard label="Commission due" value={data.summary.commissionDue} tone="due" />
        <SummaryCard label="Commission paid" value={data.summary.commissionPaid} tone="paid" />
      </section>

      {data.exceptions.length ? (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/25 dark:text-amber-100">
          <div className="flex items-center gap-2 font-medium"><AlertTriangleIcon className="size-4" />Salary setup needs attention</div>
          <ul className="mt-2 grid gap-1 text-sm">{data.exceptions.map((item) => <li key={item.teamId}><span className="font-medium">{item.teamName}:</span> {item.message}</li>)}</ul>
        </section>
      ) : null}

      <section className="grid gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div><h3 className="text-lg font-semibold">Member obligations</h3><p className="text-sm text-muted-foreground">{rows.length} of {data.obligations.length} records shown</p></div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Filter label="Type" value={typeFilter} onChange={setTypeFilter} items={[["ALL", "All types"], ["SALARY", "Salary"], ["COMMISSION", "Commission"]]} />
            <Filter label="Team" value={teamFilter} onChange={setTeamFilter} items={[["ALL", "All teams"], ...teams.map((team) => [team, team] as [string, string])]} />
            <Filter label="Status" value={statusFilter} onChange={setStatusFilter} items={[["ALL", "All statuses"], ["DUE", "Due"], ["PAID", "Paid"], ["VOID", "Void"]]} />
          </div>
        </div>

        {rows.length ? (
          <>
            <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-sm">
                  <thead className="border-b bg-muted/45 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Settlement</th></tr>
                  </thead>
                  <tbody className="divide-y">{rows.map((row) => <PayoutTableRow key={row.id} row={row} />)}</tbody>
                </table>
              </div>
            </div>
            <div className="grid gap-3 md:hidden">{rows.map((row) => <PayoutMobileCard key={row.id} row={row} />)}</div>
          </>
        ) : (
          <div className="grid min-h-40 place-items-center rounded-lg border border-dashed bg-muted/20 px-5 text-center text-sm text-muted-foreground">No obligations match these filters.</div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "due" | "paid" }) {
  return <Card className={tone === "due" ? "border-l-4 border-l-amber-500" : "border-l-4 border-l-emerald-500"}><CardHeader className="pb-1"><CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</CardTitle></CardHeader><CardContent><p className="text-xl font-semibold tabular-nums sm:text-2xl">{money.format(value)}</p></CardContent></Card>;
}

function Filter({ label, value, onChange, items }: { label: string; value: string; onChange: (value: string) => void; items: [string, string][] }) {
  return <label className="grid min-w-40 gap-1 text-xs font-medium text-muted-foreground">{label}<FormSelect name={`filter-${label}`} value={value} onValueChange={(next) => onChange(next ?? "ALL")} placeholder={label}>{items.map(([itemValue, itemLabel]) => <SelectItem key={itemValue} value={itemValue}>{itemLabel}</SelectItem>)}</FormSelect></label>;
}

function PayoutTableRow({ row }: { row: PayoutWorkspaceData["obligations"][number] }) {
  return <tr className="align-top hover:bg-muted/25"><td className="px-4 py-3"><p className="font-medium">{row.memberName}</p><p className="text-xs text-muted-foreground">{row.teamName}</p></td><td className="px-4 py-3"><Badge variant="outline">{label(row.type)}</Badge><p className="mt-1 text-xs text-muted-foreground">{row.invoiceNumber ?? monthLabel(row.earnedAt)}</p></td><td className="px-4 py-3 font-semibold tabular-nums">{money.format(row.amount)}</td><td className="px-4 py-3"><StatusBadge status={row.status} /></td><td className="w-[470px] px-4 py-3">{row.status === "DUE" ? <SettlementForm row={row} /> : <SettlementDetails row={row} />}</td></tr>;
}

function PayoutMobileCard({ row }: { row: PayoutWorkspaceData["obligations"][number] }) {
  return <Card><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-base">{row.memberName}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{row.teamName} · {row.invoiceNumber ?? monthLabel(row.earnedAt)}</p></div><StatusBadge status={row.status} /></div></CardHeader><CardContent className="grid gap-4"><div className="flex items-center justify-between border-y py-3"><Badge variant="outline">{label(row.type)}</Badge><strong className="text-lg tabular-nums">{money.format(row.amount)}</strong></div>{row.status === "DUE" ? <SettlementForm row={row} mobile /> : <SettlementDetails row={row} />}</CardContent></Card>;
}

function SettlementForm({ row, mobile = false }: { row: PayoutWorkspaceData["obligations"][number]; mobile?: boolean }) {
  const [state, action, pending] = useActionState(recordFullPayout, initialActionState);
  return <form action={action} className={mobile ? "grid gap-2" : "grid grid-cols-[125px_140px_minmax(100px,1fr)_auto] items-end gap-2"}>
    <input type="hidden" name="obligationId" value={row.id} />
    <label className="grid gap-1 text-xs text-muted-foreground">Method<FormSelect name="method" defaultValue="ONLINE" placeholder="Method"><SelectItem value="ONLINE">Online</SelectItem><SelectItem value="CASH">Cash</SelectItem><SelectItem value="CARD">Card</SelectItem><SelectItem value="OTHER">Other</SelectItem></FormSelect></label>
    <label className="grid gap-1 text-xs text-muted-foreground">Paid date<Input name="paidAt" type="date" required defaultValue={malaysiaToday()} /></label>
    <label className="grid gap-1 text-xs text-muted-foreground">Reference<Input name="referenceNumber" maxLength={200} placeholder="Optional" /></label>
    <Button type="submit" disabled={pending}><BanknoteIcon />{pending ? "Recording..." : `Pay ${money.format(row.amount)}`}</Button>
    <label className={mobile ? "grid gap-1 text-xs text-muted-foreground" : "col-span-full grid gap-1 text-xs text-muted-foreground"}>Note<Textarea name="note" maxLength={1000} rows={2} placeholder="Optional payout note" /></label>
    {state.error ? <p role="alert" className="col-span-full text-xs text-destructive">{state.error}</p> : null}
    {state.success ? <p role="status" className="col-span-full text-xs text-emerald-700 dark:text-emerald-300">{state.success}</p> : null}
  </form>;
}

function SettlementDetails({ row }: { row: PayoutWorkspaceData["obligations"][number] }) {
  if (row.status === "VOID") return <span className="text-sm text-muted-foreground">No payment recorded</span>;
  return <div className="flex items-start gap-2 text-sm"><CheckCircle2Icon className="mt-0.5 size-4 text-emerald-600" /><div><p>{label(row.payoutMethod ?? "")} · {row.paidAt ? date.format(new Date(row.paidAt)) : "Paid"}</p>{row.referenceNumber ? <p className="text-xs text-muted-foreground">Ref {row.referenceNumber}</p> : null}</div></div>;
}

function StatusBadge({ status }: { status: "DUE" | "PAID" | "VOID" }) {
  const className = status === "DUE" ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300" : status === "PAID" ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-300" : "";
  return <Badge variant="outline" className={className}>{label(status)}</Badge>;
}

function label(value: string) { return `${value.slice(0, 1)}${value.slice(1).toLowerCase()}`; }
function monthLabel(value: string) { return new Intl.DateTimeFormat("en-MY", { month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" }).format(new Date(value)); }
function malaysiaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}
