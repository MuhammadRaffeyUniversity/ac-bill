import {
  CompensationType,
  PayoutObligationStatus,
  PayoutObligationType,
} from "../../generated/prisma/enums";
import { allocateSalaryToMembers } from "./calculations";
import { getPayoutMonthRange } from "./month";

type SalaryTeamInput = {
  id: string;
  monthlySalaryAmount: number | null;
  members: Array<{ id: string }>;
};

export type SalaryGenerationResult = {
  createdCount: number;
  exceptions: Array<{ teamId: string; teamName: string; message: string }>;
};

export function salarySourceKey(teamId: string, memberId: string, periodKey: string) {
  return `salary:${teamId}:${memberId}:${periodKey}`;
}

export function buildSalaryObligationDrafts(team: SalaryTeamInput, periodKey: string) {
  if (team.members.length !== 2) {
    throw new Error("Salary teams require exactly two active members.");
  }
  if (team.monthlySalaryAmount == null) {
    throw new Error("Monthly salary is not configured.");
  }

  const [first, second] = team.members;
  const allocation = allocateSalaryToMembers({
    monthlyTeamSalary: team.monthlySalaryAmount,
    memberIds: [first.id, second.id],
  });
  const { rangeStart } = getPayoutMonthRange(periodKey);

  return allocation.members.map((member) => ({
    type: PayoutObligationType.SALARY,
    status: PayoutObligationStatus.DUE,
    teamId: team.id,
    teamMemberId: member.memberId,
    periodKey,
    sourceKey: salarySourceKey(team.id, member.memberId, periodKey),
    amount: member.amount,
    earnedAt: rangeStart,
  }));
}

export async function ensureSalaryObligations(periodKey: string): Promise<SalaryGenerationResult> {
  const { db } = await import("../db");
  const teams = await db.team.findMany({
    where: { active: true, compensationType: CompensationType.SALARY },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      monthlySalaryAmount: true,
      members: {
        where: { active: true },
        orderBy: [{ name: "asc" }, { id: "asc" }],
        select: { id: true },
      },
    },
  });

  let createdCount = 0;
  const exceptions: SalaryGenerationResult["exceptions"] = [];

  for (const team of teams) {
    try {
      const drafts = buildSalaryObligationDrafts({
        id: team.id,
        monthlySalaryAmount: team.monthlySalaryAmount == null ? null : Number(team.monthlySalaryAmount),
        members: team.members,
      }, periodKey);
      const created = await db.payoutObligation.createMany({ data: drafts, skipDuplicates: true });
      createdCount += created.count;
    } catch (error) {
      exceptions.push({
        teamId: team.id,
        teamName: team.name,
        message: error instanceof Error ? error.message : "Salary setup is invalid.",
      });
    }
  }

  return { createdCount, exceptions };
}
