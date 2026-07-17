import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const monitoring = readFileSync(new URL("./monitoring.ts", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../../../components/dashboard/ceo-dashboard.tsx", import.meta.url), "utf8");

describe("CEO company expense visibility", () => {
  it("loads the selected-period total and recent company expenses", () => {
    expect(monitoring).toContain("companyExpense.aggregate");
    expect(monitoring).toContain("companyExpense.findMany");
    expect(monitoring).toContain("companyExpenses:");
    expect(monitoring).toContain("MonitoringCompanyExpense");
    expect(monitoring).toContain("date: inRange");
    expect(monitoring).toContain("take: 8");
  });

  it("renders company expenses without exposing ledger mutations", () => {
    expect(dashboard).toContain('title="Company expenses"');
    expect(dashboard).toContain("Company expense total");
    expect(dashboard).toContain("Payment method");
    expect(dashboard).toContain("No company expenses recorded");
    expect(dashboard).not.toContain("createCompanyExpense");
  });
});
