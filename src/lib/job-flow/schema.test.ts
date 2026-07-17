import { describe, expect, it } from "vitest";

import { teamReportCloseoutSchema } from "./schema";

const validReport = {
  jobId: "job_1",
  expectedUpdatedAt: "2026-07-13T10:00:00.000Z",
  rawWhatsAppText: "Completed service. Customer paid RM 180 cash.",
  submittedByMemberId: "",
  entryDate: "2026-07-13",
  performed: "YES",
  status: "COMPLETED",
  paymentStatus: "PAID",
  completedAmount: 180,
  payments: [{ method: "CASH", amount: 180, collectedByTeam: true, referenceNumber: "", notes: "" }],
  note: "Cooling confirmed.",
};

describe("teamReportCloseoutSchema", () => {
  it("accepts a manually confirmed completed cash report", () => {
    const parsed = teamReportCloseoutSchema.parse(validReport);

    expect(parsed.completedAmount).toBe(180);
    expect(parsed.payments).toHaveLength(1);
  });

  it("accepts split payments whose sum matches the completed amount", () => {
    const result = teamReportCloseoutSchema.safeParse({
      ...validReport,
      rawWhatsAppText: "Completed service. Customer paid RM 100 cash and RM 80 online.",
      payments: [
        { method: "CASH", amount: 100, collectedByTeam: true, referenceNumber: "", notes: "" },
        { method: "ONLINE", amount: 80, collectedByTeam: false, referenceNumber: "TX-1", notes: "" },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("accepts a closeout without an optional WhatsApp message or note", () => {
    const result = teamReportCloseoutSchema.safeParse({
      ...validReport,
      rawWhatsAppText: "",
      note: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rawWhatsAppText).toBe("");
      expect(result.data.note).toBe("");
    }
  });

  it("limits an optional closeout note to 2,000 characters", () => {
    expect(teamReportCloseoutSchema.safeParse({ ...validReport, note: "x".repeat(2_000) }).success).toBe(true);
    expect(teamReportCloseoutSchema.safeParse({ ...validReport, note: "x".repeat(2_001) }).success).toBe(false);
  });

  it("rejects completed work that was not performed", () => {
    expect(teamReportCloseoutSchema.safeParse({ ...validReport, performed: "NO" }).success).toBe(false);
  });

  it("rejects paid and partial outcomes whose rows do not match the amount", () => {
    expect(teamReportCloseoutSchema.safeParse({ ...validReport, payments: [] }).success).toBe(false);
    expect(teamReportCloseoutSchema.safeParse({ ...validReport, payments: [{ ...validReport.payments[0], amount: 200 }] }).success).toBe(false);
    expect(teamReportCloseoutSchema.safeParse({ ...validReport, paymentStatus: "PARTIALLY_PAID", payments: [{ ...validReport.payments[0], amount: 180 }] }).success).toBe(false);
  });

  it("accepts a partial payment below the completed amount", () => {
    const result = teamReportCloseoutSchema.safeParse({
      ...validReport,
      paymentStatus: "PARTIALLY_PAID",
      payments: [{ ...validReport.payments[0], amount: 80 }],
    });

    expect(result.success).toBe(true);
  });

  it("requires unpaid and no-charge outcomes to have no payment rows", () => {
    expect(teamReportCloseoutSchema.safeParse({ ...validReport, paymentStatus: "UNPAID", payments: [] }).success).toBe(true);
    expect(teamReportCloseoutSchema.safeParse({ ...validReport, paymentStatus: "UNPAID", completedAmount: "", payments: [] }).success).toBe(false);
    expect(teamReportCloseoutSchema.safeParse({ ...validReport, paymentStatus: "UNPAID", completedAmount: 0, payments: [] }).success).toBe(false);
    expect(teamReportCloseoutSchema.safeParse({ ...validReport, paymentStatus: "UNPAID" }).success).toBe(false);
    expect(teamReportCloseoutSchema.safeParse({ ...validReport, paymentStatus: "NO_CHARGE", completedAmount: 0, payments: [] }).success).toBe(true);
    expect(teamReportCloseoutSchema.safeParse({ ...validReport, paymentStatus: "NO_CHARGE", completedAmount: 50, payments: [] }).success).toBe(false);
  });

  it("keeps cancelled closeout and payment outcomes together", () => {
    const cancelled = { ...validReport, performed: "NO", status: "CANCELLED", paymentStatus: "CANCELLED", completedAmount: 0, payments: [] };

    expect(teamReportCloseoutSchema.safeParse(cancelled).success).toBe(true);
    expect(teamReportCloseoutSchema.safeParse({ ...cancelled, paymentStatus: "UNPAID" }).success).toBe(false);
    expect(teamReportCloseoutSchema.safeParse({ ...validReport, paymentStatus: "CANCELLED" }).success).toBe(false);
  });
});
