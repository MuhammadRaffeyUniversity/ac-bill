const DEFAULT_TEAM_RATE = 0.6;
const DEFAULT_PARTNER_RATE = 0.25;
const DEFAULT_COMPANY_RATE = 0.15;

type PaymentStatus = "PAID" | "PARTIALLY_PAID" | "UNPAID" | "NO_CHARGE" | "CANCELLED" | "NOT_RECORDED";

type CommissionTeamInput = {
  sales: number;
  teamRate?: number;
  partnerRate?: number;
  companyRate?: number;
};

type SalaryTeamInput = {
  sales: number;
  approvedExpenses: number;
  senderRate?: number;
};

type InvoiceBalanceInput = {
  invoiceItems: number[];
  payments: number[];
};

type PaymentReconciliationInput = {
  salaryTeamProfit: number;
  commissionTeamCompanyShare: number;
  onlineReceived: number;
  depositedCash: number;
};

type CloseJobInput = {
  jobPerformed: boolean;
  invoiceCreatedAfterService: boolean;
  paymentStatus: PaymentStatus;
};

const closeoutPaymentStatuses = new Set<PaymentStatus>([
  "PAID",
  "PARTIALLY_PAID",
  "UNPAID",
  "NO_CHARGE",
  "CANCELLED",
]);

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sumMoney(values: number[]) {
  return roundMoney(values.reduce((total, value) => total + value, 0));
}

export function calculateCommissionTeamSplit({
  sales,
  teamRate = DEFAULT_TEAM_RATE,
  partnerRate = DEFAULT_PARTNER_RATE,
  companyRate = DEFAULT_COMPANY_RATE,
}: CommissionTeamInput) {
  return {
    sales: roundMoney(sales),
    teamShare: roundMoney(sales * teamRate),
    partnerShare: roundMoney(sales * partnerRate),
    companyShare: roundMoney(sales * companyRate),
  };
}

export function calculateSalaryTeamProfit({
  sales,
  approvedExpenses,
  senderRate = DEFAULT_PARTNER_RATE,
}: SalaryTeamInput) {
  const senderShare = roundMoney(sales * senderRate);

  return {
    sales: roundMoney(sales),
    senderShare,
    approvedExpenses: roundMoney(approvedExpenses),
    companyProfit: roundMoney(sales - senderShare - approvedExpenses),
  };
}

export function calculateInvoiceBalance({ invoiceItems, payments }: InvoiceBalanceInput) {
  const invoiceTotal = sumMoney(invoiceItems);
  const paidTotal = sumMoney(payments);

  return {
    invoiceTotal,
    paidTotal,
    balanceDue: roundMoney(invoiceTotal - paidTotal),
  };
}

export function calculatePaymentReconciliation({
  salaryTeamProfit,
  commissionTeamCompanyShare,
  onlineReceived,
  depositedCash,
}: PaymentReconciliationInput) {
  const dailyEarnings = roundMoney(salaryTeamProfit + commissionTeamCompanyShare);
  const balanceReceived = roundMoney(onlineReceived + depositedCash);

  return {
    dailyEarnings,
    balanceReceived,
    reconciliationDifference: roundMoney(dailyEarnings - balanceReceived),
  };
}

export function canCloseJob({
  jobPerformed,
  invoiceCreatedAfterService,
  paymentStatus,
}: CloseJobInput) {
  return jobPerformed && invoiceCreatedAfterService && closeoutPaymentStatuses.has(paymentStatus);
}
