export function JobSummary({ customer, phone, address, summary, team }: { customer: string; phone: string; address: string; summary: string; team: string | null }) {
  return <div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="rounded-md border bg-card px-2 py-1">{customer} · {phone}</span><span className="rounded-md border bg-card px-2 py-1">{summary}</span><span className="rounded-md border bg-card px-2 py-1">{team ?? "Unassigned"}</span><span className="max-w-full truncate rounded-md border bg-card px-2 py-1">{address}</span></div>;
}
