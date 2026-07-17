import { describe, expect, it } from "vitest";

import { recordFullPayoutSchema } from "./schema";

describe("record full payout schema", () => {
  it("accepts a complete payout record", () => {
    expect(recordFullPayoutSchema.safeParse({
      obligationId: "obligation",
      method: "ONLINE",
      paidAt: "2026-07-17",
      referenceNumber: "TX-1",
    }).success).toBe(true);
  });

  it("requires the obligation and payment date", () => {
    expect(recordFullPayoutSchema.safeParse({
      obligationId: "",
      method: "ONLINE",
      paidAt: "",
    }).success).toBe(false);
  });
});
