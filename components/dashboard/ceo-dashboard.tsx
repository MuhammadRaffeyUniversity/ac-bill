import { CalendarDaysIcon, CircleCheckIcon, ClipboardListIcon, HandCoinsIcon, LandmarkIcon, TrendingUpIcon, WalletCardsIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MonitoringJob, MonitoringPeriod, MonitoringSnapshot } from "@/src/lib/dashboard/monitoring";
import { cn } from "@/lib/utils";

const currency = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 2 });
const dateFormatter = new Intl.DateTimeFormat("en-MY", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function formatStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatMoney(value: number) {
  return currency.format(value);
}

function formatJobTime(job: MonitoringJob) {
  return dateFormatter.format(job.scheduledAt ?? job.createdAt);
}

export function CeoDashboard({ snapshot }: { snapshot: MonitoringSnapshot }) {
  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-5 sm:py-7 md:px-8 md:py-9" data-motion="list">
      <nav className="flex flex-wrap items-center gap-2" aria-label="Dashboard period" data-motion="item">
        <p className="mr-1 text-sm font-medium text-muted-foreground">Period</p>
        {(["today", "7d", "30d"] as const).map((period) => <PeriodLink key={period} period={period} active={snapshot.period} />)}
      </nav>

      <section aria-label="Operational overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-motion="list">
        <Metric icon={ClipboardListIcon} label="Jobs received" value={snapshot.jobs.total.toString()} detail={`${snapshot.jobs.assigned + snapshot.jobs.inProgress} active`} />
        <Metric icon={CircleCheckIcon} label="Jobs completed" value={snapshot.jobs.completed.toString()} detail={`${snapshot.jobs.booked} awaiting assignment`} />
        <Metric icon={WalletCardsIcon} label="Payments received" value={formatMoney(snapshot.finance.received)} detail={`${formatMoney(snapshot.finance.cashCollectedByTeams)} cash collected by teams`} />
        <Metric icon={TrendingUpIcon} label="Company profit recorded" value={formatMoney(snapshot.finance.companyProfit)} detail={`${formatMoney(snapshot.finance.invoiced)} invoiced`} />
      </section>

      <section data-motion="item">
        <SectionHeading title="Company expenses" description={`Operating costs recorded in ${snapshot.label.toLowerCase()}.`} />
        <div className="grid gap-3 xl:grid-cols-[minmax(240px,0.35fr)_minmax(0,1fr)]">
          <Metric icon={LandmarkIcon} label="Company expense total" value={formatMoney(snapshot.companyExpenses.total)} detail={`${snapshot.companyExpenses.recent.length} recent records shown`} />
          {snapshot.companyExpenses.recent.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-[#d8e0dc] bg-background dark:border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Payment method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.companyExpenses.recent.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-mono text-xs">{expense.date}</TableCell>
                      <TableCell className="font-medium">{expense.category}</TableCell>
                      <TableCell>{expense.paymentMethod ? formatStatus(expense.paymentMethod) : "Not recorded"}</TableCell>
                      <TableCell className="text-right font-medium">{formatMoney(expense.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState icon={LandmarkIcon} title="No company expenses recorded" description={`Company expenses dated within ${snapshot.label.toLowerCase()} will appear here.`} />
          )}
        </div>
      </section>

      <section data-motion="item">
        <SectionHeading title="Team payouts — current month" description="Read-only totals from member salary and commission obligations." />
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric icon={HandCoinsIcon} label="Salary payouts" value={formatMoney(snapshot.payouts.salaryPaid)} detail={`${formatMoney(snapshot.payouts.salaryDue)} still due`} />
          <Metric icon={HandCoinsIcon} label="Commission payouts" value={formatMoney(snapshot.payouts.commissionPaid)} detail={`${formatMoney(snapshot.payouts.commissionDue)} still due`} />
        </div>
      </section>

      <section className="grid gap-3 rounded-lg border border-[#d8e0dc] bg-background p-4 dark:border-border sm:grid-cols-3" data-motion="item">
        <Overview label="Unassigned work" value={snapshot.jobs.unassigned} tone={snapshot.jobs.unassigned > 0 ? "warning" : "neutral"} />
        <Overview label="In progress" value={snapshot.jobs.inProgress} tone="neutral" />
        <Overview label="Cancelled" value={snapshot.jobs.cancelled} tone="neutral" />
      </section>

      <section data-motion="item">
        <SectionHeading title="Needs attention" description="Monitoring flags only. Operational changes belong with the responsible team." />
        {snapshot.attention.length > 0 ? <JobTable jobs={snapshot.attention} /> : <EmptyState icon={CircleCheckIcon} title="No monitoring flags" description={`There are no jobs needing attention in ${snapshot.label.toLowerCase()}.`} />}
      </section>

      <section data-motion="item">
        <SectionHeading title="Recent jobs" description="Latest records across the operation." />
        {snapshot.recent.length > 0 ? <JobTable jobs={snapshot.recent} quiet /> : <EmptyState icon={CalendarDaysIcon} title="No jobs recorded" description={`Jobs created in ${snapshot.label.toLowerCase()} will appear here.`} />}
      </section>
    </div>
  );
}

function PeriodLink({ period, active }: { period: MonitoringPeriod; active: MonitoringPeriod }) {
  const label = period === "today" ? "Today" : period === "7d" ? "7 days" : "30 days";
  return <a href={period === "today" ? "/" : `/?period=${period}`} className={cn("rounded-md border px-3 py-1.5 text-sm font-medium transition-colors", period === active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted")}>{label}</a>;
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof ClipboardListIcon; label: string; value: string; detail: string }) {
  return <article className="rounded-lg border border-[#d8e0dc] bg-background p-4 dark:border-border"><Icon className="size-5 text-primary" /><p className="mt-4 text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tracking-normal">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></article>;
}

function Overview({ label, value, tone }: { label: string; value: number; tone: "warning" | "neutral" }) {
  return <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{label}</p><span className={cn("text-xl font-semibold", tone === "warning" && "text-amber-700 dark:text-amber-400")}>{value}</span></div>;
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return <div className="mb-3 flex flex-col justify-between gap-1 sm:flex-row sm:items-end sm:gap-4"><h2 className="text-xl font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{description}</p></div>;
}

function JobTable({ jobs, quiet = false }: { jobs: MonitoringJob[]; quiet?: boolean }) {
  return <div className="overflow-x-auto rounded-lg border border-[#d8e0dc] bg-background dark:border-border"><Table><TableHeader><TableRow className="hover:bg-transparent"><TableHead>Customer</TableHead><TableHead>Area</TableHead><TableHead>Service</TableHead><TableHead>Scheduled / recorded</TableHead><TableHead>Team</TableHead><TableHead className="text-right">{quiet ? "Status" : "Flag"}</TableHead></TableRow></TableHeader><TableBody>{jobs.map((job) => <TableRow key={job.id}><TableCell><p className="font-medium">{job.customer}</p><p className="text-xs text-muted-foreground">{job.id}</p></TableCell><TableCell>{job.area ?? "Not recorded"}</TableCell><TableCell>{formatStatus(job.serviceType)}</TableCell><TableCell>{formatJobTime(job)}</TableCell><TableCell>{job.assignedTeam ?? "Unassigned"}</TableCell><TableCell className="text-right"><IssueBadge issue={quiet ? formatStatus(job.status) : job.issue} tone={quiet ? "success" : job.tone} /></TableCell></TableRow>)}</TableBody></Table></div>;
}

function IssueBadge({ issue, tone }: { issue: string; tone: "danger" | "warning" | "success" }) {
  return <Badge variant="outline" className={cn("border font-medium", tone === "danger" && "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300", tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300", tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300")}>{issue}</Badge>;
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof CircleCheckIcon; title: string; description: string }) {
  return <div className="flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed border-[#d8e0dc] bg-background px-5 text-center dark:border-border"><Icon className="size-5 text-muted-foreground" /><p className="mt-3 font-medium">{title}</p><p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p></div>;
}
