import { describe, expect, it } from "vitest";

import { calculateInvoiceTotals, formatInvoiceNumber, getPaymentSummary } from "./calculations";

describe("billing calculations", () => {
  it("calculates invoice totals to two decimal places", () => {
    expect(calculateInvoiceTotals([{ description: "Service", quantity: 2, unitPrice: 99.995 }], 10, 5)).toEqual({
      subtotal: 199.99,
      discount: 10,
      tax: 5,
      total: 194.99,
    });
  });

  it("identifies split and completed payment states", () => {
    expect(getPaymentSummary(300, [{ amount: 120 }, { amount: 180 }])).toMatchObject({ paid: 300, balance: 0, isPaid: true });
    expect(getPaymentSummary(300, [{ amount: 120 }])).toMatchObject({ paid: 120, balance: 180, isPartial: true });
  });

  it("formats sequential monthly invoice numbers", () => {
    expect(formatInvoiceNumber(new Date("2026-07-10T00:00:00.000Z"), 8)).toBe("INV-202607-0008");
  });
});
