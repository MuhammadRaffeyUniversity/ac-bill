import { db } from "@/src/lib/db";
import type { RevenuePeriod, RevenueRange } from "@/src/lib/dashboard/revenue-range";
import { getPayoutMonthRange, parsePayoutMonth } from "@/src/lib/payouts/month";

export type MonitoringPeriod = RevenuePeriod;

export type MonitoringSnapshot = {
  selection: Pick<RevenueRange, "period" | "from" | "to">;
  label: string;
  rangeStart: Date;
  rangeEnd: Date;
  jobs: {
    total: number;
    booked: number;
    assigned: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    unassigned: number;
  };
  finance: {
    billedRevenue: number;
    paymentsCollected: number;
    invoiced: number;
    received: number;
    cashCollectedByTeams: number;
    companyProfit: number;
  };
  companyExpenses: {
    total: number;
    recent: MonitoringCompanyExpense[];
  };
  payouts: {
    salaryDue: number;
    salaryPaid: number;
    commissionDue: number;
    commissionPaid: number;
  };
  attention: MonitoringJob[];
  recent: MonitoringJob[];
};

export type MonitoringCompanyExpense = {
  id: string;
  date: string;
  category: string;
  amount: number;
  paymentMethod: string | null;
};

export type MonitoringJob = {
  id: string;
  customer: string;
  area: string | null;
  serviceType: string;
  status: string;
  paymentStatus: string;
  assignedTeam: string | null;
  scheduledAt: Date | null;
  createdAt: Date;
  issue: "Assignment" | "Payment" | "Review" | "On track";
  tone: "danger" | "warning" | "success";
};

function numeric(value: { toString(): string } | null | undefined) {
  return value ? Number(value.toString()) : 0;
}

function mapJob(job: {
  id: string;
  serviceType: string;
  status: string;
  paymentStatus: string;
  scheduledWindowStart: Date | null;
  createdAt: Date;
  customer: { name: string };
  address: { area: string | null; city: string | null };
  assignedTeam: { name: string } | null;
}): MonitoringJob {
  const assignedTeam = job.assignedTeam?.name ?? null;
  const requiresPayment = job.status === "COMPLETED" && ["NOT_RECORDED", "UNPAID", "PARTIALLY_PAID"].includes(job.paymentStatus);

  if (!assignedTeam && !["COMPLETED", "CANCELLED"].includes(job.status)) {
    return { ...job, customer: job.customer.name, area: job.address.area ?? job.address.city, assignedTeam, scheduledAt: job.scheduledWindowStart, issue: "Assignment", tone: "danger" };
  }

  if (requiresPayment) {
    return { ...job, customer: job.customer.name, area: job.address.area ?? job.address.city, assignedTeam, scheduledAt: job.scheduledWindowStart, issue: "Payment", tone: "warning" };
  }

  if (job.status === "BOOKED") {
    return { ...job, customer: job.customer.name, area: job.address.area ?? job.address.city, assignedTeam, scheduledAt: job.scheduledWindowStart, issue: "Review", tone: "warning" };
  }

  return { ...job, customer: job.customer.name, area: job.address.area ?? job.address.city, assignedTeam, scheduledAt: job.scheduledWindowStart, issue: "On track", tone: "success" };
}

export async function getMonitoringSnapshot(range: RevenueRange): Promise<MonitoringSnapshot> {
  const inRange = { gte: range.rangeStart, lt: range.rangeEnd };
  const payoutPeriodKey = parsePayoutMonth(undefined);
  const payoutRange = getPayoutMonthRange(payoutPeriodKey);
  const jobSelect = {
    id: true,
    serviceType: true,
    status: true,
    paymentStatus: true,
    scheduledWindowStart: true,
    createdAt: true,
    customer: { select: { name: true } },
    address: { select: { area: true, city: true } },
    assignedTeam: { select: { name: true } },
  } as const;

  const [
    total,
    booked,
    assigned,
    inProgress,
    completed,
    cancelled,
    unassigned,
    invoiceTotals,
    paymentTotals,
    teamCashTotals,
    profitTotals,
    companyExpenseTotals,
    recentCompanyExpenses,
    salaryDueTotals,
    salaryPaidTotals,
    commissionDueTotals,
    commissionPaidTotals,
    attentionRows,
    recentRows,
  ] = await Promise.all([
    db.job.count({ where: { createdAt: inRange } }),
    db.job.count({ where: { createdAt: inRange, status: "BOOKED" } }),
    db.job.count({ where: { createdAt: inRange, status: "ASSIGNED" } }),
    db.job.count({ where: { createdAt: inRange, status: "IN_PROGRESS" } }),
    db.job.count({ where: { createdAt: inRange, status: "COMPLETED" } }),
    db.job.count({ where: { createdAt: inRange, status: "CANCELLED" } }),
    db.job.count({ where: { createdAt: inRange, assignedTeamId: null, status: { in: ["BOOKED", "ASSIGNED", "IN_PROGRESS"] } } }),
    db.invoice.aggregate({ where: { issuedAt: inRange, status: { not: "VOID" } }, _sum: { total: true } }),
    db.payment.aggregate({ where: { receivedAt: inRange }, _sum: { amount: true } }),
    db.payment.aggregate({ where: { receivedAt: inRange, method: "CASH", collectedByTeam: true }, _sum: { amount: true } }),
    db.commissionEntry.aggregate({ where: { calculatedAt: inRange }, _sum: { netCompanyProfit: true } }),
    db.companyExpense.aggregate({
      where: { date: inRange },
      _sum: { amount: true },
    }),
    db.companyExpense.findMany({
      where: { date: inRange },
      select: {
        id: true,
        date: true,
        category: true,
        amount: true,
        paymentMethod: true,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    db.payoutObligation.aggregate({
      where: { type: "SALARY", status: "DUE", periodKey: payoutPeriodKey },
      _sum: { amount: true },
    }),
    db.payoutObligation.aggregate({
      where: { type: "SALARY", status: "PAID", periodKey: payoutPeriodKey },
      _sum: { amount: true },
    }),
    db.payoutObligation.aggregate({
      where: {
        type: "COMMISSION",
        status: "DUE",
        earnedAt: { gte: payoutRange.rangeStart, lt: payoutRange.rangeEnd },
      },
      _sum: { amount: true },
    }),
    db.payoutObligation.aggregate({
      where: {
        type: "COMMISSION",
        status: "PAID",
        earnedAt: { gte: payoutRange.rangeStart, lt: payoutRange.rangeEnd },
      },
      _sum: { amount: true },
    }),
    db.job.findMany({
      where: {
        createdAt: inRange,
        OR: [
          { assignedTeamId: null, status: { in: ["BOOKED", "ASSIGNED", "IN_PROGRESS"] } },
          { status: "COMPLETED", paymentStatus: { in: ["NOT_RECORDED", "UNPAID", "PARTIALLY_PAID"] } },
          { status: "BOOKED" },
        ],
      },
      select: jobSelect,
      orderBy: [{ scheduledWindowStart: "asc" }, { createdAt: "desc" }],
      take: 8,
    }),
    db.job.findMany({ where: { createdAt: inRange }, select: jobSelect, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  return {
    selection: {
      period: range.period,
      from: range.from,
      to: range.to,
    },
    label: range.label,
    rangeStart: range.rangeStart,
    rangeEnd: range.rangeEnd,
    jobs: { total, booked, assigned, inProgress, completed, cancelled, unassigned },
    finance: {
      billedRevenue: numeric(invoiceTotals._sum.total),
      paymentsCollected: numeric(paymentTotals._sum.amount),
      invoiced: numeric(invoiceTotals._sum.total),
      received: numeric(paymentTotals._sum.amount),
      cashCollectedByTeams: numeric(teamCashTotals._sum.amount),
      companyProfit: numeric(profitTotals._sum.netCompanyProfit),
    },
    companyExpenses: {
      total: numeric(companyExpenseTotals._sum.amount),
      recent: recentCompanyExpenses.map((expense) => ({
        id: expense.id,
        date: expense.date.toISOString().slice(0, 10),
        category: expense.category,
        amount: numeric(expense.amount),
        paymentMethod: expense.paymentMethod,
      })),
    },
    payouts: {
      salaryDue: numeric(salaryDueTotals._sum.amount),
      salaryPaid: numeric(salaryPaidTotals._sum.amount),
      commissionDue: numeric(commissionDueTotals._sum.amount),
      commissionPaid: numeric(commissionPaidTotals._sum.amount),
    },
    attention: attentionRows.map(mapJob),
    recent: recentRows.map(mapJob),
  };
}
