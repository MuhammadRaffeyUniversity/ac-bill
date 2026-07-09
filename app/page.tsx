import Link from "next/link";
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  CircleUserRoundIcon,
  FilePlus2Icon,
  LogOutIcon,
  PrinterIcon,
  TrendingUpIcon,
  TruckIcon,
  WalletCardsIcon,
} from "lucide-react";

import { signOut } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/src/lib/auth/guards";
import { navigationItems } from "@/src/lib/config/business";
import { getCommandCenterJobs, type CommandCenterJob } from "@/src/lib/dashboard/command-center";
import { dispatchJobs, todayMetrics } from "@/src/lib/dashboard/sample-data";
import { calculateCommissionTeamSplit, calculatePaymentReconciliation, calculateSalaryTeamProfit } from "@/src/lib/finance/calculations";
import { cn } from "@/lib/utils";
import { businessSetup } from "@/src/lib/config/business";

const currency = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  maximumFractionDigits: 2,
});

const commissionSplit = calculateCommissionTeamSplit({
  sales: todayMetrics.commissionTeamSales,
  ...businessSetup.commissionTeamRates,
});

const salaryProfit = calculateSalaryTeamProfit({
  sales: todayMetrics.salaryTeamSales,
  approvedExpenses: todayMetrics.approvedTeamExpenses,
  senderRate: businessSetup.senderCommissionRate,
});

const reconciliation = calculatePaymentReconciliation({
  salaryTeamProfit: salaryProfit.companyProfit,
  commissionTeamCompanyShare: commissionSplit.companyShare,
  onlineReceived: todayMetrics.onlineReceived,
  depositedCash: todayMetrics.depositedCash,
});

const commandCenter = getCommandCenterJobs(dispatchJobs);

function formatMoney(value: number) {
  return currency.format(value);
}

export default async function Home() {
  const session = await requireRole(["ADMIN"]);
  const attentionSummary = `${commandCenter.attention.filter((job) => job.issue === "Review").length} review items · ${commandCenter.attention.filter((job) => job.issue === "Payment").length} payment gaps`;

  return (
    <main className="min-h-screen bg-[#f7f9f8] text-foreground dark:bg-background">
      <div className="grid min-h-screen lg:grid-cols-[208px_minmax(0,1fr)]">
        <aside className="border-b border-[#d8e0dc] bg-background px-5 py-6 lg:border-r lg:border-b-0 dark:border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <TruckIcon className="size-4" />
            </div>
            <p className="text-base font-semibold">AC Bill</p>
          </div>

          <nav className="mt-10 flex gap-1 overflow-x-auto lg:flex-col" aria-label="Main navigation">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: item.href === "/" ? "secondary" : "ghost" }),
                  "h-9 shrink-0 justify-start px-3 text-sm font-medium",
                )}
              >
                {item.href === "/" ? "Today" : item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="min-w-0">
          <header className="border-b border-[#d8e0dc] bg-background px-5 py-5 md:px-8 dark:border-border">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h1 className="text-3xl font-semibold leading-none">Today</h1>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarDaysIcon className="size-3.5" />
                  Tuesday, 09 July
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="mr-auto flex min-w-0 items-center gap-2 px-1 xl:mr-1">
                  <CircleUserRoundIcon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{session.user.name || "Admin account"}</p>
                    <p className="truncate text-xs text-muted-foreground">CEO / Admin</p>
                  </div>
                </div>
                <ThemeToggle />
                <Button variant="ghost" size="icon" title="Print daily report" aria-label="Print daily report">
                  <PrinterIcon />
                </Button>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/signin" });
                  }}
                >
                  <Button variant="ghost" size="icon" type="submit" title="Sign out" aria-label="Sign out">
                    <LogOutIcon />
                  </Button>
                </form>
                <Link href="/jobs/intake" className={cn(buttonVariants({ variant: "default" }), "h-10 px-4")}>
                  <FilePlus2Icon data-icon="inline-start" />
                  New job
                </Link>
              </div>
            </div>
          </header>

          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-7 md:px-8 md:py-9">
            <a
              href="#needs-attention"
              className="flex flex-col gap-3 rounded-lg border border-amber-300/80 bg-amber-50 px-4 py-3 text-amber-950 transition-colors hover:bg-amber-100 sm:flex-row sm:items-center sm:justify-between dark:border-amber-600/50 dark:bg-amber-950/30 dark:text-amber-100"
            >
              <div className="flex items-start gap-3 sm:items-center">
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400 sm:mt-0" />
                <div>
                  <p className="text-sm font-semibold">{commandCenter.attention.length} jobs need attention</p>
                  <p className="text-xs text-amber-800/85 dark:text-amber-200/80">{attentionSummary}</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-sm font-medium text-amber-800 dark:text-amber-200">
                Review now
                <ChevronRightIcon className="size-4" />
              </span>
            </a>

            <section id="needs-attention" className="scroll-mt-6">
              <SectionHeading title="Needs attention" description="Jobs that need a decision before the day can move forward." />
              <JobTable jobs={commandCenter.attention} />
            </section>

            <section aria-label="Financial pulse" className="grid divide-y rounded-lg border border-[#d8e0dc] bg-background sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:border-border">
              <PulseMetric icon={CircleCheckIcon} label="Jobs completed" value={`${todayMetrics.completedJobs} / ${todayMetrics.totalJobs}`} />
              <PulseMetric icon={WalletCardsIcon} label="Cash to deposit" value={formatMoney(todayMetrics.cashHeldByTeams)} />
              <PulseMetric icon={TrendingUpIcon} label="Daily profit" value={formatMoney(reconciliation.dailyEarnings)} />
            </section>

            <section>
              <SectionHeading title="On track" description="Jobs progressing without an immediate blocker." />
              <JobTable jobs={commandCenter.onTrack} quiet />
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-3 flex flex-col justify-between gap-1 sm:flex-row sm:items-end sm:gap-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function JobTable({ jobs, quiet = false }: { jobs: readonly CommandCenterJob<(typeof dispatchJobs)[number]>[]; quiet?: boolean }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border border-[#d8e0dc] bg-background md:block dark:border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Customer</TableHead>
              <TableHead>Job ID / Area</TableHead>
              <TableHead>Scheduled time</TableHead>
              <TableHead>Assigned team</TableHead>
              <TableHead className="text-right">{quiet ? "Status" : "Issue"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.customer}</TableCell>
                <TableCell>
                  <p className="font-medium">{job.id}</p>
                  <p className="text-xs text-muted-foreground">{job.area}</p>
                </TableCell>
                <TableCell>{job.time}</TableCell>
                <TableCell>{job.suggestedTeam}</TableCell>
                <TableCell className="text-right">
                  <IssueBadge issue={job.issue} tone={job.tone} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {jobs.map((job) => (
          <article key={job.id} className="rounded-lg border border-[#d8e0dc] bg-background p-4 dark:border-border">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{job.customer}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{job.id} · {job.area}</p>
              </div>
              <IssueBadge issue={job.issue} tone={job.tone} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Fact label="Scheduled" value={job.time} />
              <Fact label="Team" value={job.suggestedTeam} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function IssueBadge({ issue, tone }: { issue: string; tone: "danger" | "warning" | "success" }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border font-medium",
        tone === "danger" && "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
      )}
    >
      {issue}
    </Badge>
  );
}

function PulseMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CircleCheckIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <Icon className="size-5 text-primary" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold tracking-normal">{value}</p>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate font-medium">{value}</p>
    </div>
  );
}
