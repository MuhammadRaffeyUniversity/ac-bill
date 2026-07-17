import { calculateSalaryTeamProfit } from "../finance/calculations";
import { allocateCommissionToMembers, calculateCommissionableSales } from "./calculations";

type CompensationType = "SALARY" | "COMMISSION";

type CommissionRecordInput = {
  invoiceId: string;
  jobId: string;
  teamId: string;
  partnerId: string;
  compensationType: CompensationType;
  subtotal: number;
  discount: number;
  members: readonly [{ id: string }, { id: string }];
  rates: {
    teamRate: number;
    partnerRate: number;
    companyRate: number;
  };
  earnedAt: Date;
};

export function commissionSourceKey(invoiceId: string, teamMemberId: string) {
  return `commission:${invoiceId}:${teamMemberId}`;
}

export function buildCommissionRecords(input: CommissionRecordInput) {
  const commissionableSales = calculateCommissionableSales({
    subtotal: input.subtotal,
    discount: input.discount,
  });

  if (input.compensationType === "SALARY") {
    const result = calculateSalaryTeamProfit({
      sales: commissionableSales,
      approvedExpenses: 0,
      senderRate: input.rates.partnerRate,
    });

    return {
      commissionEntry: {
        invoiceId: input.invoiceId,
        jobId: input.jobId,
        teamId: input.teamId,
        partnerId: input.partnerId,
        salesAmount: result.sales,
        teamAmount: 0,
        partnerAmount: result.senderShare,
        companyAmount: result.companyProfit,
        expenseAmount: 0,
        netCompanyProfit: result.companyProfit,
        calculatedAt: input.earnedAt,
      },
      obligations: [],
    };
  }

  const allocation = allocateCommissionToMembers({
    commissionableSales,
    memberIds: [input.members[0].id, input.members[1].id],
    ...input.rates,
  });

  return {
    commissionEntry: {
      invoiceId: input.invoiceId,
      jobId: input.jobId,
      teamId: input.teamId,
      partnerId: input.partnerId,
      salesAmount: allocation.sales,
      teamAmount: allocation.teamShare,
      partnerAmount: allocation.partnerShare,
      companyAmount: allocation.companyShare,
      expenseAmount: 0,
      netCompanyProfit: allocation.companyShare,
      calculatedAt: input.earnedAt,
    },
    obligations: allocation.members.map((member) => ({
      type: "COMMISSION" as const,
      status: "DUE" as const,
      teamId: input.teamId,
      teamMemberId: member.memberId,
      invoiceId: input.invoiceId,
      sourceKey: commissionSourceKey(input.invoiceId, member.memberId),
      amount: member.amount,
      earnedAt: input.earnedAt,
    })),
  };
}
