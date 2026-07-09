import {
  AlertTriangleIcon,
  BanknoteIcon,
  CalendarDaysIcon,
  ClipboardCheckIcon,
  CircleUserRoundIcon,
  FileTextIcon,
  ListFilterIcon,
  LogOutIcon,
  PrinterIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  TruckIcon,
} from "lucide-react";
import Link from "next/link";

import { signOut } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { businessSetup, navigationItems, teamWorkloadRows } from "@/src/lib/config/business";
import { dispatchJobs, intakeReview, todayMetrics } from "@/src/lib/dashboard/sample-data";
import { cn } from "@/lib/utils";
import { requireRole } from "@/src/lib/auth/guards";
import {
  calculateCommissionTeamSplit,
  calculatePaymentReconciliation,
  calculateSalaryTeamProfit,
} from "@/src/lib/finance/calculations";

const currency = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  maximumFractionDigits: 2,
});

function formatMoney(value: number) {
  return currency.format(value);
}

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

const kpis = [
  {
    label: "Today's jobs",
    value: todayMetrics.totalJobs.toString(),
    detail: `${todayMetrics.assignedJobs} assigned, ${todayMetrics.completedJobs} completed`,
    icon: ClipboardCheckIcon,
  },
  {
    label: "Sales reviewed",
    value: formatMoney(todayMetrics.salaryTeamSales + todayMetrics.commissionTeamSales),
    detail: "Salary and commission queues",
    icon: FileTextIcon,
  },
  {
    label: "Cash held",
    value: formatMoney(todayMetrics.cashHeldByTeams),
    detail: "Team cash before deposit",
    icon: BanknoteIcon,
  },
  {
    label: "Company profit",
    value: formatMoney(reconciliation.dailyEarnings),
    detail: `${formatMoney(reconciliation.reconciliationDifference)} mismatch`,
    icon: ShieldCheckIcon,
  },
];

function statusVariant(status: string) {
  if (status === "In progress") return "default";
  if (status === "Assigned") return "secondary";
  return "outline";
}

export default async function Home() {
  const session = await requireRole(["ADMIN"]);

  return (
    <main className="min-h-screen bg-muted/30 text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[232px_minmax(0,1fr)]">
        <aside className="border-b bg-background px-4 py-4 lg:border-r lg:border-b-0">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <TruckIcon />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">AC Bill</p>
              <p className="text-xs text-muted-foreground">Operations</p>
            </div>
          </div>

          <nav className="mt-6 flex gap-1 overflow-x-auto lg:flex-col">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: item.href === "/" ? "secondary" : "ghost" }),
                  "justify-start"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Separator className="my-5" />

          <div className="grid gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Active setup</p>
              <p className="font-medium">{businessSetup.activeTeams} teams configured</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{businessSetup.salaryTeams} salary teams</Badge>
              <Badge variant="outline">{businessSetup.commissionTeams} commission team</Badge>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="border-b bg-background px-4 py-3 md:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-normal">Daily operations dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Intake, dispatch, closeout, and workbook-style reconciliation for today.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex min-w-0 items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5">
                  <CircleUserRoundIcon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-sm font-medium">{session.user.name || "Admin account"}</p>
                    <p className="hidden truncate text-xs text-muted-foreground sm:block">
                      {session.user.email}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  <CalendarDaysIcon data-icon="inline-start" />
                  09 Jul 2026
                </Badge>
                <Badge variant="secondary">CEO / Admin</Badge>
                <ThemeToggle />
                <Button variant="outline">
                  <PrinterIcon data-icon="inline-start" />
                  Daily report
                </Button>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/signin" });
                  }}
                >
                  <Button variant="outline" type="submit">
                    <LogOutIcon data-icon="inline-start" />
                    Sign out
                  </Button>
                </form>
              </div>
            </div>
          </header>

          <div className="grid gap-4 p-4 md:p-6">
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {kpis.map((kpi) => (
                <Card key={kpi.label} size="sm">
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">{kpi.label}</CardTitle>
                    <CardAction>
                      <kpi.icon />
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold tracking-normal">{kpi.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{kpi.detail}</p>
                  </CardContent>
                </Card>
              ))}
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
              <Card>
                <CardHeader>
                  <CardTitle>Dispatch queue</CardTitle>
                  <CardDescription>
                    Review booked jobs, suggested teams, payment status, and closeout blockers.
                  </CardDescription>
                  <CardAction className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <ListFilterIcon data-icon="inline-start" />
                      Filters
                    </Button>
                    <Button size="sm">
                      <RefreshCwIcon data-icon="inline-start" />
                      Refresh
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="relative md:w-72">
                      <SearchIcon className="pointer-events-none absolute top-2 left-2.5 text-muted-foreground" />
                      <Input className="pl-8" placeholder="Search job, area, customer" />
                    </div>
                    <Tabs defaultValue="today" className="md:items-end">
                      <TabsList>
                        <TabsTrigger value="today">Today</TabsTrigger>
                        <TabsTrigger value="week">Week</TabsTrigger>
                        <TabsTrigger value="month">Month</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="grid gap-2 md:hidden">
                    {dispatchJobs.map((job) => (
                      <div key={job.id} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{job.id}</p>
                            <p className="text-xs text-muted-foreground">{job.customer}</p>
                          </div>
                          <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <MobileFact label="Time" value={job.time} />
                          <MobileFact label="Area" value={job.area} />
                          <MobileFact label="Service" value={`${job.service} x${job.units}`} />
                          <MobileFact label="Payment" value={job.payment} />
                        </div>
                        <div className="mt-3 rounded-lg bg-muted/50 p-2 text-sm">
                          <p className="font-medium">{job.suggestedTeam}</p>
                          <p className="text-xs text-muted-foreground">{job.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Area</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Team</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dispatchJobs.map((job) => (
                          <TableRow key={job.id}>
                            <TableCell>
                              <div className="font-medium">{job.id}</div>
                              <div className="text-xs text-muted-foreground">{job.customer}</div>
                            </TableCell>
                            <TableCell>{job.time}</TableCell>
                            <TableCell>{job.area}</TableCell>
                            <TableCell>
                              {job.service}
                              <span className="ml-1 text-xs text-muted-foreground">x{job.units}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={job.payment === "Not recorded" ? "destructive" : "outline"}>
                                {job.payment}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-36">
                              <div className="truncate font-medium">{job.suggestedTeam}</div>
                              <div className="truncate text-xs text-muted-foreground">{job.reason}</div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>WhatsApp intake review</CardTitle>
                  <CardDescription>
                    LLM extraction is review-only; money is entered after service confirmation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Textarea value={intakeReview.rawMessage} readOnly className="min-h-36 resize-none text-xs" />

                  <div className="grid gap-2">
                    {intakeReview.extractedFields.map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border bg-muted/40 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <AlertTriangleIcon />
                      <p className="text-sm font-medium">Needs human review</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {intakeReview.missingFields.map((field) => (
                        <Badge key={field} variant="destructive">
                          {field}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Extraction confidence: {intakeReview.confidence}%
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline">Save as booked</Button>
                    <Button>Assign team</Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
              <Card>
                <CardHeader>
                  <CardTitle>Team cash and workload</CardTitle>
                  <CardDescription>
                    Cash collected by teams stays separate from online/account payments.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:hidden">
                    {teamWorkloadRows.map((team) => (
                      <div key={team.label} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{team.label}</p>
                            <p className="text-xs text-muted-foreground">{team.region}</p>
                          </div>
                          <Badge variant="outline">{team.activeJobs} active</Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <MobileFact label="Completed" value={team.completedJobs.toString()} />
                          <MobileFact label="Cash held" value={formatMoney(team.cashHeld)} />
                          <MobileFact label="Sent" value={formatMoney(team.sentOnline)} />
                          <MobileFact label="Expenses" value={formatMoney(team.expenses)} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Team</TableHead>
                          <TableHead>Region</TableHead>
                          <TableHead>Active</TableHead>
                          <TableHead>Completed</TableHead>
                          <TableHead>Cash held</TableHead>
                          <TableHead>Sent</TableHead>
                          <TableHead>Expenses</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamWorkloadRows.map((team) => (
                          <TableRow key={team.label}>
                            <TableCell className="font-medium">{team.label}</TableCell>
                            <TableCell>{team.region}</TableCell>
                            <TableCell>{team.activeJobs}</TableCell>
                            <TableCell>{team.completedJobs}</TableCell>
                            <TableCell>{formatMoney(team.cashHeld)}</TableCell>
                            <TableCell>{formatMoney(team.sentOnline)}</TableCell>
                            <TableCell>{formatMoney(team.expenses)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profit split and reconciliation</CardTitle>
                  <CardDescription>Workbook examples verified by finance tests.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="grid gap-2 rounded-lg border p-3">
                    <p className="text-sm font-medium">Commission team split</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <Metric label="Team" value={commissionSplit.teamShare} />
                      <Metric label="Sender" value={commissionSplit.partnerShare} />
                      <Metric label="Company" value={commissionSplit.companyShare} />
                    </div>
                  </div>

                  <div className="grid gap-2 rounded-lg border p-3">
                    <p className="text-sm font-medium">Salary team profit</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <Metric label="Sales" value={salaryProfit.sales} />
                      <Metric label="Sender" value={salaryProfit.senderShare} />
                      <Metric label="Profit" value={salaryProfit.companyProfit} />
                    </div>
                  </div>

                  <div className="rounded-lg border bg-muted/40 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">Daily earnings</span>
                      <span className="font-semibold">{formatMoney(reconciliation.dailyEarnings)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">Balance received</span>
                      <span className="font-semibold">{formatMoney(reconciliation.balanceReceived)}</span>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">Mismatch</span>
                      <Badge variant="destructive">
                        {formatMoney(reconciliation.reconciliationDifference)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{formatMoney(value)}</p>
    </div>
  );
}

function MobileFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
