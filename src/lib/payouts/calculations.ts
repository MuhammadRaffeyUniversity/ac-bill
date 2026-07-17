export type MemberAllocation = {
  total: number;
  members: Array<{ memberId: string; amount: number }>;
};

export type CommissionAllocationInput = {
  commissionableSales: number;
  memberIds: readonly [string, string];
  teamRate: number;
  partnerRate: number;
  companyRate: number;
};

const toCents = (value: number) => Math.round((value + Number.EPSILON) * 100);
const fromCents = (value: number) => value / 100;

export function calculateCommissionableSales({
  subtotal,
  discount,
}: {
  subtotal: number;
  discount: number;
}) {
  return fromCents(toCents(subtotal) - toCents(discount));
}

export function allocateSalaryToMembers({
  monthlyTeamSalary,
  memberIds,
}: {
  monthlyTeamSalary: number;
  memberIds: readonly [string, string];
}): MemberAllocation {
  const totalCents = toCents(monthlyTeamSalary);
  if (totalCents <= 0 || totalCents % 2 !== 0) {
    throw new Error("Salary must split equally between two members.");
  }

  const memberAmount = fromCents(totalCents / 2);
  return {
    total: fromCents(totalCents),
    members: memberIds.map((memberId) => ({ memberId, amount: memberAmount })),
  };
}

export function allocateCommissionToMembers(input: CommissionAllocationInput) {
  const rateTotal = input.teamRate + input.partnerRate + input.companyRate;
  if (Math.abs(rateTotal - 1) > 0.000001) {
    throw new Error("Commission rates must total 100%.");
  }

  const salesCents = toCents(input.commissionableSales);
  const teamCents = Math.round(salesCents * input.teamRate);
  const partnerCents = Math.round(salesCents * input.partnerRate);
  const companyCents = salesCents - teamCents - partnerCents;
  const firstMemberCents = Math.ceil(teamCents / 2);
  const secondMemberCents = teamCents - firstMemberCents;

  return {
    sales: fromCents(salesCents),
    teamShare: fromCents(teamCents),
    partnerShare: fromCents(partnerCents),
    companyShare: fromCents(companyCents),
    members: [
      { memberId: input.memberIds[0], amount: fromCents(firstMemberCents) },
      { memberId: input.memberIds[1], amount: fromCents(secondMemberCents) },
    ],
  };
}

export function validateFullPayout({
  obligationAmount,
  payoutAmount,
}: {
  obligationAmount: number;
  payoutAmount: number;
}) {
  return toCents(obligationAmount) === toCents(payoutAmount);
}
