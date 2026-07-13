export type ReportPaymentStatus = "PAID" | "PARTIALLY_PAID" | "UNPAID" | "NO_CHARGE" | "CANCELLED";

export type ReportPayment = {
  id: string;
  method: "CASH" | "ONLINE" | "CARD" | "OTHER";
  amount: number;
  collectedByTeam: boolean;
  referenceNumber: string;
  notes: string;
};

export function paymentRowsRequired(paymentStatus: ReportPaymentStatus) {
  return paymentStatus === "PAID" || paymentStatus === "PARTIALLY_PAID";
}

export function getSubmittedPayments(paymentStatus: ReportPaymentStatus, payments: ReportPayment[]) {
  if (!paymentRowsRequired(paymentStatus)) return [];

  return payments.map((payment) => ({
    method: payment.method,
    amount: payment.amount,
    collectedByTeam: payment.collectedByTeam,
    referenceNumber: payment.referenceNumber,
    notes: payment.notes,
  }));
}
