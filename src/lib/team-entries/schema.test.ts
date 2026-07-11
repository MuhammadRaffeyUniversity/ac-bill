import { describe, expect, it } from "vitest";

import { createTeamEntrySchema } from "./schema";

const validEntry = {
  rawWhatsAppText: "Job completed. Customer paid cash and team will deposit tomorrow.",
  entryType: "PAYMENT",
  teamId: "team_1",
  submittedByMemberId: "",
  jobId: "",
  entryDate: "2026-07-10",
  notes: "",
  completedAmount: "",
  paymentMethod: "",
};

describe("createTeamEntrySchema", () => {
  it("preserves optional relationship fields as empty values for the action to normalize", () => {
    const parsed = createTeamEntrySchema.parse(validEntry);

    expect(parsed.teamId).toBe("team_1");
    expect(parsed.jobId).toBe("");
    expect(parsed.submittedByMemberId).toBe("");
  });

  it("requires enough raw WhatsApp text for an auditable entry", () => {
    const result = createTeamEntrySchema.safeParse({ ...validEntry, rawWhatsAppText: "Paid" });

    expect(result.success).toBe(false);
  });

  it("requires a team", () => {
    const result = createTeamEntrySchema.safeParse({ ...validEntry, teamId: "" });

    expect(result.success).toBe(false);
  });

  it("requires a linked job and manually entered amount for a completion update", () => {
    const missingJob = createTeamEntrySchema.safeParse({ ...validEntry, entryType: "COMPLETION", completedAmount: "75" });
    const missingAmount = createTeamEntrySchema.safeParse({ ...validEntry, entryType: "COMPLETION", jobId: "job_1" });

    expect(missingJob.success).toBe(false);
    expect(missingAmount.success).toBe(false);
  });

  it("accepts an operator-entered completion amount and payment method without parsing the WhatsApp text", () => {
    const parsed = createTeamEntrySchema.parse({ ...validEntry, entryType: "COMPLETION", jobId: "job_1", completedAmount: "75", paymentMethod: "CASH" });

    expect(parsed.completedAmount).toBe(75);
    expect(parsed.paymentMethod).toBe("CASH");
  });
});
