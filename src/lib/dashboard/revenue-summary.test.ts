import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const monitoring = readFileSync(new URL("./monitoring.ts", import.meta.url), "utf8");

describe("CEO revenue aggregation", () => {
  it("uses the validated selection for billed and collected revenue", () => {
    expect(monitoring).toContain("getMonitoringSnapshot(range: RevenueRange)");
    expect(monitoring).toContain("gte: range.rangeStart");
    expect(monitoring).toContain("lt: range.rangeEnd");
    expect(monitoring).toContain("issuedAt: inRange");
    expect(monitoring).toContain('status: { not: "VOID" }');
    expect(monitoring).toContain("receivedAt: inRange");
    expect(monitoring).toContain("billedRevenue:");
    expect(monitoring).toContain("paymentsCollected:");
    expect(monitoring).toContain("selection:");
  });
});
