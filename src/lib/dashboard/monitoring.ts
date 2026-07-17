import { db } from "@/src/lib/db";
import { getPayoutMonthRange, parsePayoutMonth } from "@/src/lib/payouts/month";

export const monitoringPeriods = ["today", "7d", "30d"] as const;

export type MonitoringPeriod = (typeof monitoringPeriods)[number];

export type MonitoringSnapshot = {
  period: MonitoringPeriod;
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
    invoiced: number;
    received: number;
    cashCollectedByTeams: number;
    companyProfit: number;
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

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getRange(period: MonitoringPeriod, now = new Date()) {
  const rangeEnd = new Date(now);
  const rangeStart = startOfDay(now);

  if (period === "7d") rangeStart.setDate(rangeStart.getDate() - 6);
  if (period === "30d") rangeStart.setDate(rangeStart.getDate() - 29);

  return {
    rangeStart,
    rangeEnd,
    label: period === "today" ? "Today" : period === "7d" ? "Last 7 days" : "Last 30 days",
  };
}

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

export function parseMonitoringPeriod(value: string | undefined): MonitoringPeriod {
  return monitoringPeriods.includes(value as MonitoringPeriod) ? (value as MonitoringPeriod) : "today";
}

export async function getMonitoringSnapshot(period: MonitoringPeriod): Promise<MonitoringSnapshot> {
  const { rangeStart, rangeEnd, label } = getRange(period);
  const inRange = { gte: rangeStart, lte: rangeEnd };
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
    period,
    label,
    rangeStart,
    rangeEnd,
    jobs: { total, booked, assigned, inProgress, completed, cancelled, unassigned },
    finance: {
      invoiced: numeric(invoiceTotals._sum.total),
      received: numeric(paymentTotals._sum.amount),
      cashCollectedByTeams: numeric(teamCashTotals._sum.amount),
      companyProfit: numeric(profitTotals._sum.netCompanyProfit),
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
