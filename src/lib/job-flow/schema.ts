import { z } from "zod";

import { paymentLineSchema } from "../billing/schema";

const amountSchema = z.coerce.number().finite().min(0).max(1_000_000);

export const teamReportCloseoutSchema = z.object({
  jobId: z.string().trim().min(1),
  expectedUpdatedAt: z.string().datetime({ offset: true }),
  rawWhatsAppText: z.string().trim().min(10, "Paste the complete WhatsApp update so the audit record is useful."),
  submittedByMemberId: z.string().trim().optional().or(z.literal("")),
  entryDate: z.coerce.date(),
  performed: z.enum(["YES", "NO"]),
  status: z.enum(["COMPLETED", "POSTPONED", "CANCELLED"]),
  paymentStatus: z.enum(["PAID", "PARTIALLY_PAID", "UNPAID", "NO_CHARGE", "CANCELLED"]),
  completedAmount: amountSchema,
  payments: z.array(paymentLineSchema).max(10).default([]),
  note: z.string().trim().min(1, "Add a closeout note for the audit trail.").max(2_000),
}).superRefine((report, context) => {
  const paidCents = report.payments.reduce((sum, payment) => sum + toCents(payment.amount), 0);
  const completedCents = toCents(report.completedAmount);

  if (report.status === "COMPLETED" && report.performed !== "YES") {
    context.addIssue({ code: "custom", path: ["performed"], message: "Completed work must be confirmed as performed." });
  }

  if (report.status === "CANCELLED") {
    if (report.paymentStatus !== "CANCELLED") {
      context.addIssue({ code: "custom", path: ["paymentStatus"], message: "Cancelled jobs must use the cancelled payment outcome." });
    }
    if (report.payments.length) {
      context.addIssue({ code: "custom", path: ["payments"], message: "Cancelled jobs cannot include payment rows." });
    }
  } else if (report.paymentStatus === "CANCELLED") {
    context.addIssue({ code: "custom", path: ["paymentStatus"], message: "The cancelled payment outcome is only valid for a cancelled job." });
  }

  if (report.paymentStatus === "PAID" && (completedCents <= 0 || paidCents !== completedCents)) {
    context.addIssue({ code: "custom", path: ["payments"], message: "Paid rows must equal the completed amount." });
  }

  if (report.paymentStatus === "PARTIALLY_PAID" && (paidCents <= 0 || paidCents >= completedCents)) {
    context.addIssue({ code: "custom", path: ["payments"], message: "Partial payments must be greater than zero and below the completed amount." });
  }

  if (["UNPAID", "NO_CHARGE"].includes(report.paymentStatus) && report.payments.length) {
    context.addIssue({ code: "custom", path: ["payments"], message: "This payment outcome cannot include payment rows." });
  }

  if (report.paymentStatus === "NO_CHARGE" && completedCents !== 0) {
    context.addIssue({ code: "custom", path: ["completedAmount"], message: "No-charge work must have a zero amount." });
  }
});

export type TeamReportCloseoutInput = z.infer<typeof teamReportCloseoutSchema>;

function toCents(value: number) {
  return Math.round((value + Number.EPSILON) * 100);
}
