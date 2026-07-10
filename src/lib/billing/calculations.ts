export type InvoiceLineInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type PaymentLineInput = {
  amount: number;
};

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateInvoiceTotals(
  items: InvoiceLineInput[],
  discount = 0,
  tax = 0,
) {
  const subtotal = money(items.reduce((total, item) => total + item.quantity * item.unitPrice, 0));
  const total = money(Math.max(0, subtotal - discount) + tax);

  return { subtotal, discount: money(discount), tax: money(tax), total };
}

export function getPaymentSummary(total: number, payments: PaymentLineInput[]) {
  const paid = money(payments.reduce((sum, payment) => sum + payment.amount, 0));
  const balance = money(Math.max(0, total - paid));

  return {
    paid,
    balance,
    isPaid: total === 0 || paid >= total,
    isPartial: paid > 0 && paid < total,
    isOverpaid: paid > total,
  };
}

export function formatInvoiceNumber(date: Date, sequence: number) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `INV-${year}${month}-${String(sequence).padStart(4, "0")}`;
}
