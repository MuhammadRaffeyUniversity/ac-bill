import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../../app/(ceo)/page.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("./ceo-dashboard.tsx", import.meta.url), "utf8");

describe("CEO revenue controls", () => {
  it("resolves revenue range search parameters inside the protected CEO route", () => {
    expect(page).toContain("resolveRevenueRange");
    expect(page).toContain("params.from");
    expect(page).toContain("params.to");
    expect(page).toContain('requireRole(["ADMIN"])');
  });

  it("renders read-only preset and custom revenue controls", () => {
    expect(dashboard).toContain("Billed revenue");
    expect(dashboard).toContain("Payments collected");
    expect(dashboard).toContain('value="custom"');
    expect(dashboard).toContain('name="from"');
    expect(dashboard).toContain('name="to"');
    expect(dashboard).toContain("Apply range");
    expect(dashboard).toContain("24 hr");
    expect(dashboard).not.toContain("createRevenue");
  });
});
