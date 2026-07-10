import { describe, expect, it } from "vitest";

import { closeoutJobSchema, createTeamExpenseSchema } from "./schemas";

describe("data-entry operation schemas", () => {
  it("requires a performed decision and payment outcome for closeout", () => {
    const result = closeoutJobSchema.safeParse({ jobId: "job_1", status: "COMPLETED", paymentStatus: "PAID", note: "Completed." });
    expect(result.success).toBe(false);
  });

  it("requires a positive, attributable team expense", () => {
    const result = createTeamExpenseSchema.safeParse({ teamId: "", date: "2026-07-10", category: "Petrol", amount: 0, paidBy: "TEAM" });
    expect(result.success).toBe(false);
  });
});
