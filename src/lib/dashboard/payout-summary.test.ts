import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const monitoring = readFileSync(new URL("./monitoring.ts", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../../../components/dashboard/ceo-dashboard.tsx", import.meta.url), "utf8");

describe("CEO payout summary", () => {
  it("queries current-month salary and commission obligations", () => {
    expect(monitoring).toContain("payoutObligation.aggregate");
    expect(monitoring).toContain("salaryDue");
    expect(monitoring).toContain("salaryPaid");
    expect(monitoring).toContain("commissionDue");
    expect(monitoring).toContain("commissionPaid");
  });

  it("renders read-only payout totals", () => {
    expect(dashboard).toContain("Salary payouts");
    expect(dashboard).toContain("Commission payouts");
    expect(dashboard).not.toContain("recordFullPayout");
  });
});
