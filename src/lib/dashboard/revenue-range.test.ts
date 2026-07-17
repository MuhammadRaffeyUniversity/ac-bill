import { describe, expect, it } from "vitest";

import { resolveRevenueRange } from "./revenue-range";

const now = new Date("2026-07-17T07:30:00.000Z");

describe("resolveRevenueRange", () => {
  it("resolves the current Malaysia calendar day for 24h", () => {
    expect(resolveRevenueRange({ period: "24h" }, now)).toEqual({
      period: "24h",
      from: "2026-07-17",
      to: "2026-07-17",
      rangeStart: new Date("2026-07-16T16:00:00.000Z"),
      rangeEnd: now,
      label: "17 Jul 2026",
    });
  });

  it("resolves seven Malaysia calendar days through now", () => {
    expect(resolveRevenueRange({ period: "7d" }, now)).toEqual({
      period: "7d",
      from: "2026-07-11",
      to: "2026-07-17",
      rangeStart: new Date("2026-07-10T16:00:00.000Z"),
      rangeEnd: now,
      label: "11 Jul 2026 – 17 Jul 2026",
    });
  });

  it("resolves thirty Malaysia calendar days through now", () => {
    expect(resolveRevenueRange({ period: "30d" }, now)).toEqual({
      period: "30d",
      from: "2026-06-18",
      to: "2026-07-17",
      rangeStart: new Date("2026-06-17T16:00:00.000Z"),
      rangeEnd: now,
      label: "18 Jun 2026 – 17 Jul 2026",
    });
  });

  it("includes both dates in a valid custom range", () => {
    expect(resolveRevenueRange(
      { period: "custom", from: "2026-07-01", to: "2026-07-17" },
      now,
    )).toEqual({
      period: "custom",
      from: "2026-07-01",
      to: "2026-07-17",
      rangeStart: new Date("2026-06-30T16:00:00.000Z"),
      rangeEnd: new Date("2026-07-17T16:00:00.000Z"),
      label: "01 Jul 2026 – 17 Jul 2026",
    });
  });

  it.each([
    [{ period: "year" }],
    [{ period: "custom", from: "2026-07-01" }],
    [{ period: "custom", from: "2026-02-30", to: "2026-03-02" }],
    [{ period: "custom", from: "2026-07-18", to: "2026-07-17" }],
  ])("falls back to the current Malaysia day for invalid input %#", (input) => {
    expect(resolveRevenueRange(input, now)).toEqual(resolveRevenueRange({ period: "24h" }, now));
  });
});
