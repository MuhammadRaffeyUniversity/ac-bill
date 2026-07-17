import { describe, expect, it } from "vitest";

import { buildSalaryObligationDrafts, salarySourceKey } from "./salary-obligations";

describe("salary obligations", () => {
  it("builds two uniquely sourced RM 1,000 member obligations", () => {
    expect(salarySourceKey("team", "member", "2026-07")).toBe("salary:team:member:2026-07");
    expect(buildSalaryObligationDrafts({
      id: "team",
      monthlySalaryAmount: 2000,
      members: [{ id: "a" }, { id: "b" }],
    }, "2026-07")).toEqual([
      expect.objectContaining({ sourceKey: "salary:team:a:2026-07", amount: 1000 }),
      expect.objectContaining({ sourceKey: "salary:team:b:2026-07", amount: 1000 }),
    ]);
  });

  it("rejects salary teams without exactly two active members", () => {
    expect(() => buildSalaryObligationDrafts({
      id: "team",
      monthlySalaryAmount: 2000,
      members: [{ id: "a" }],
    }, "2026-07")).toThrow("exactly two active members");
  });

  it("rejects salary teams without a configured monthly salary", () => {
    expect(() => buildSalaryObligationDrafts({
      id: "team",
      monthlySalaryAmount: null,
      members: [{ id: "a" }, { id: "b" }],
    }, "2026-07")).toThrow("Monthly salary is not configured");
  });
});
