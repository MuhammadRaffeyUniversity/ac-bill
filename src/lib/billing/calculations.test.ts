import { describe, expect, it } from "vitest";

import { createInvoiceWithPaymentsSchema, feedbackSchema } from "./schema";
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

  it("requires the customer verification details from the approved review form", () => {
    const result = feedbackSchema.safeParse({
      token: "a".repeat(24),
      rating: 5,
      paidAmount: "75",
      paymentMethod: "CASH",
      acCooling: "YES",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.paidAmount).toBe(75);
      expect(result.data.acCooling).toBe("YES");
    }
  });

  it("rejects an incomplete customer verification", () => {
    const result = feedbackSchema.safeParse({ token: "a".repeat(24), rating: 5, paidAmount: "75", paymentMethod: "CASH" });

    expect(result.success).toBe(false);
  });

  it("accepts initial split payments up to the invoice total", () => {
    const result = createInvoiceWithPaymentsSchema.safeParse({
      jobId: "job_1",
      discount: 0,
      tax: 0,
      dueAt: "",
      items: [{ description: "Service", quantity: 1, unitPrice: 180 }],
      payments: [
        { method: "CASH", amount: 100, collectedByTeam: true, referenceNumber: "", notes: "" },
        { method: "ONLINE", amount: 80, collectedByTeam: false, referenceNumber: "TX-1", notes: "" },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects initial payments above the invoice total", () => {
    const result = createInvoiceWithPaymentsSchema.safeParse({
      jobId: "job_1",
      discount: 0,
      tax: 0,
      dueAt: "",
      items: [{ description: "Service", quantity: 1, unitPrice: 180 }],
      payments: [{ method: "CASH", amount: 181, collectedByTeam: true, referenceNumber: "", notes: "" }],
    });

    expect(result.success).toBe(false);
  });

  it("allows unpaid and zero-total invoices without fabricated payments", () => {
    const unpaid = createInvoiceWithPaymentsSchema.safeParse({ jobId: "job_1", discount: 0, tax: 0, dueAt: "", items: [{ description: "Service", quantity: 1, unitPrice: 180 }], payments: [] });
    const noCharge = createInvoiceWithPaymentsSchema.safeParse({ jobId: "job_2", discount: 0, tax: 0, dueAt: "", items: [{ description: "No-charge callback", quantity: 1, unitPrice: 0 }], payments: [] });

    expect(unpaid.success).toBe(true);
    expect(noCharge.success).toBe(true);
  });
});
