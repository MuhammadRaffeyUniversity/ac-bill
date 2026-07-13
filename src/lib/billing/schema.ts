import { z } from "zod";

import { calculateInvoiceTotals } from "./calculations";

const amount = z.coerce.number().finite().min(0).max(1_000_000);

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Each item needs a description.").max(250),
  quantity: z.coerce.number().finite().positive("Quantity must be greater than zero.").max(10_000),
  unitPrice: amount,
});

export const createInvoiceSchema = z.object({
  jobId: z.string().trim().min(1),
  discount: amount.default(0),
  tax: amount.default(0),
  dueAt: z.string().trim().optional().or(z.literal("")),
  items: z.array(invoiceItemSchema).min(1, "Add at least one invoice item.").max(50),
});

export const paymentLineSchema = z.object({
  method: z.enum(["CASH", "ONLINE", "CARD", "OTHER"]),
  amount: z.coerce.number().finite().positive("Payment amount must be greater than zero.").max(1_000_000),
  collectedByTeam: z.boolean(),
  referenceNumber: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(1_000).optional().or(z.literal("")),
});

export const recordPaymentsSchema = z.object({
  invoiceId: z.string().trim().min(1),
  payments: z.array(paymentLineSchema).min(1).max(10),
});

export const createInvoiceWithPaymentsSchema = createInvoiceSchema.extend({
  payments: z.array(paymentLineSchema).max(10).default([]),
}).superRefine((invoice, context) => {
  const totals = calculateInvoiceTotals(invoice.items, invoice.discount, invoice.tax);
  const paid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  if (paid > totals.total + 0.005) {
    context.addIssue({ code: "custom", path: ["payments"], message: "Payments cannot exceed the invoice total." });
  }
});

export const feedbackSchema = z.object({
  token: z.string().trim().min(16).max(200),
  rating: z.coerce.number().int().min(1).max(5),
  paidAmount: amount,
  paymentMethod: z.enum(["CASH", "ONLINE", "CARD", "OTHER"]),
  acCooling: z.enum(["YES", "NO"]),
  comment: z.string().trim().max(2_000).optional().or(z.literal("")),
  publicDisplayPermission: z.boolean().default(false),
});
