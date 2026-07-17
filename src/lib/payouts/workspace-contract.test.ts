import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(path: string) {
  const url = new URL(path, import.meta.url);
  return existsSync(url) ? readFileSync(url, "utf8") : "";
}

describe("Data Entry payout workspace contract", () => {
  it("guards the page and generates monthly salary obligations", () => {
    const page = read("../../../app/(data-entry)/payouts/page.tsx");
    expect(page).toContain('requireRole(["DATA_ENTRY"])');
    expect(page).toContain("ensureSalaryObligations");
  });

  it("adds the Data Entry navigation entry", () => {
    const layout = read("../../../app/(data-entry)/layout.tsx");
    expect(layout).toContain('href: "/payouts"');
  });

  it("settles a due obligation once and writes an audit log", () => {
    const actions = read("./actions.ts");
    expect(actions).toContain('requireRole(["DATA_ENTRY"])');
    expect(actions).toContain("PayoutObligationStatus.DUE");
    expect(actions).toContain("tx.payout.create");
    expect(actions).toContain("tx.auditLog.create");
    expect(actions).toContain("ALREADY_PAID");
  });
});
