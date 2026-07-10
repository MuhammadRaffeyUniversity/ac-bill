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
});
