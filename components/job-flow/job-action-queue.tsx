import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { JobQueueGroup } from "@/src/lib/job-flow/queue";
import { jobQueueGroupLabels } from "@/src/lib/job-flow/queue";

export type JobFlowQueueRow = {
  id: string;
  customer: string;
  jobNumber: string;
  summary: string;
  location: string;
  team: string | null;
  group: JobQueueGroup;
};

const groupOrder: JobQueueGroup[] = ["CREATE_INVOICE", "ASSIGN_TEAM", "TEAM_REPORT", "CUSTOMER_HANDOFF", "CANCELLED"];

export function JobActionQueue({ rows, selectedId, search }: { rows: JobFlowQueueRow[]; selectedId?: string; search: string }) {
  return <section className="min-h-0 border-r bg-card lg:h-[calc(100vh-105px)] lg:overflow-y-auto">
    <div className="sticky top-0 z-10 border-b bg-card p-4">
      <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Needs action</h2><Badge variant="secondary">{rows.length}</Badge></div>
      <form action="/jobs" className="relative mt-3"><SearchIcon className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" /><input name="search" defaultValue={search} className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Search customer, phone or job" /></form>
    </div>
    {rows.length ? <div className="p-2">{groupOrder.map((group) => {
      const groupRows = rows.filter((row) => row.group === group);
      return groupRows.length ? <div key={group} className="mb-3"><p className="px-2 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{jobQueueGroupLabels[group]} · {groupRows.length}</p>{groupRows.map((row) => <Link key={row.id} href={`/jobs?job=${encodeURIComponent(row.id)}`} className={`mb-1 block rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted ${selectedId === row.id ? "border-primary bg-audit text-audit-foreground" : "border-transparent bg-background"}`}><div className="flex items-start justify-between gap-2"><p className="font-medium">{row.customer}</p><span className="font-mono text-[10px] text-muted-foreground">{row.jobNumber}</span></div><p className="mt-1 text-xs text-muted-foreground">{row.summary} · {row.location}</p><p className="mt-2 text-[11px] font-medium text-foreground">{row.team ?? "Unassigned"}</p></Link>)}</div> : null;
    })}</div> : <div className="grid min-h-56 place-items-center p-6 text-center text-sm text-muted-foreground"><div><p>No jobs match this queue.</p><Link href="/jobs?mode=new" className="mt-3 inline-flex text-primary underline underline-offset-4">Create a WhatsApp job</Link></div></div>}
  </section>;
}
