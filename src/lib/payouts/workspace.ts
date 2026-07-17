import { db } from "../db";
import { getPayoutMonthRange } from "./month";
import type { SalaryGenerationResult } from "./salary-obligations";

export type PayoutWorkspaceData = {
  periodKey: string;
  summary: {
    salaryDue: number;
    salaryPaid: number;
    commissionDue: number;
    commissionPaid: number;
  };
  obligations: Array<{
    id: string;
    type: "SALARY" | "COMMISSION";
    status: "DUE" | "PAID" | "VOID";
    teamName: string;
    memberName: string;
    amount: number;
    earnedAt: string;
    invoiceNumber: string | null;
    paidAt: string | null;
    payoutMethod: "CASH" | "ONLINE" | "CARD" | "OTHER" | null;
    referenceNumber: string | null;
  }>;
  exceptions: SalaryGenerationResult["exceptions"];
};

export async function getPayoutWorkspace(
  periodKey: string,
  exceptions: SalaryGenerationResult["exceptions"],
): Promise<PayoutWorkspaceData> {
  const { rangeStart, rangeEnd } = getPayoutMonthRange(periodKey);
  const rows = await db.payoutObligation.findMany({
    where: {
      OR: [
        { type: "SALARY", periodKey },
        { type: "COMMISSION", earnedAt: { gte: rangeStart, lt: rangeEnd } },
      ],
    },
    orderBy: [
      { status: "asc" },
      { team: { name: "asc" } },
      { teamMember: { name: "asc" } },
      { earnedAt: "desc" },
    ],
    select: {
      id: true,
      type: true,
      status: true,
      amount: true,
      earnedAt: true,
      team: { select: { name: true } },
      teamMember: { select: { name: true } },
      invoice: { select: { invoiceNumber: true } },
      payout: {
        select: {
          paidAt: true,
          method: true,
          referenceNumber: true,
        },
      },
    },
  });

  const summary = {
    salaryDue: 0,
    salaryPaid: 0,
    commissionDue: 0,
    commissionPaid: 0,
  };
  for (const row of rows) {
    if (row.status === "VOID") continue;
    const key = `${row.type.toLowerCase()}${row.status === "DUE" ? "Due" : "Paid"}` as keyof typeof summary;
    summary[key] += Number(row.amount);
  }

  return {
    periodKey,
    summary,
    obligations: rows.map((row) => ({
      id: row.id,
      type: row.type,
      status: row.status,
      teamName: row.team.name,
      memberName: row.teamMember.name,
      amount: Number(row.amount),
      earnedAt: row.earnedAt.toISOString(),
      invoiceNumber: row.invoice?.invoiceNumber ?? null,
      paidAt: row.payout?.paidAt.toISOString() ?? null,
      payoutMethod: row.payout?.method ?? null,
      referenceNumber: row.payout?.referenceNumber ?? null,
    })),
    exceptions,
  };
}
