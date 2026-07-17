import { describe, expect, it } from "vitest";

import { getPayoutMonthRange, parsePayoutMonth } from "./month";

describe("payout month", () => {
  it("accepts a valid month and falls back in Malaysia time", () => {
    expect(parsePayoutMonth("2026-07")).toBe("2026-07");
    expect(parsePayoutMonth("not-a-month", new Date("2026-07-17T00:00:00+08:00"))).toBe("2026-07");
  });

  it("returns Malaysia month boundaries", () => {
    expect(getPayoutMonthRange("2026-12")).toEqual({
      rangeStart: new Date("2026-12-01T00:00:00+08:00"),
      rangeEnd: new Date("2027-01-01T00:00:00+08:00"),
    });
  });
});
