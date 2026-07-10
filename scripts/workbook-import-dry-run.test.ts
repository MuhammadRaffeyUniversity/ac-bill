import { describe, expect, test } from "vitest";

import { validateWorkbookSnapshot } from "./workbook-import-dry-run";

describe("workbook import dry run", () => {
  test("reports totals and excludes non-operational sheets without writing data", () => {
    const report = validateWorkbookSnapshot({
      sheets: {
        "Salary Teams": [{ Team: "Jb 1", Sales: 510, Expense: 115 }],
        "Commission Teams": [{ Team: "Ali & Zeeshan", Sales: 560 }],
        "Company Expenses": [{ Amount: 40 }],
        "Personal Expenses": [{ Amount: 25 }],
        "Petty Cash": [{ "Cash In": 100, "Cash Out": 20 }],
        Sheet12: [{ sample: "not imported" }],
      },
    });

    expect(report.accepted).toBe(true);
    expect(report.totals).toEqual({
      salarySales: 510,
      salaryExpenses: 115,
      commissionSales: 560,
      companyExpenses: 40,
      personalExpenses: 25,
      pettyCashIn: 100,
      pettyCashOut: 20,
    });
    expect(report.teamNamesNeedingReview).toEqual(["Ali & Zeeshan", "Jb 1"]);
    expect(report.issues).toContainEqual(
      expect.objectContaining({ sheet: "Sheet12", severity: "warning" }),
    );
  });

  test("rejects incomplete rows before an operator can use the snapshot", () => {
    const report = validateWorkbookSnapshot({
      sheets: {
        "Salary Teams": [{ Team: "Jb 1", Sales: "not a number" }],
      },
    });

    expect(report.accepted).toBe(false);
    expect(report.issues).toContainEqual(
      expect.objectContaining({ sheet: "Salary Teams", row: 2, severity: "error" }),
    );
  });
});
