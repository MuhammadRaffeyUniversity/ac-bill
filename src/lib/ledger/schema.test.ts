import { describe, expect, it } from "vitest";

import { companyExpenseSchema, pettyCashEntrySchema } from "./schema";

describe("ledger schemas", () => {
  it("keeps company spending separate and attributable", () => {
    expect(companyExpenseSchema.safeParse({ date: "2026-07-10", category: "Team rent", amount: 120, paymentMethod: "ONLINE" }).success).toBe(true);
    expect(companyExpenseSchema.safeParse({ date: "2026-07-10", category: "", amount: 120 }).success).toBe(false);
  });

  it("requires a cash direction and positive amount", () => {
    expect(pettyCashEntrySchema.safeParse({ date: "2026-07-10", direction: "IN", amount: 50 }).success).toBe(true);
    expect(pettyCashEntrySchema.safeParse({ date: "2026-07-10", direction: "OUT", amount: 0 }).success).toBe(false);
  });
});
