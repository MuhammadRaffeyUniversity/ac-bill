import { describe, expect, it } from "vitest";

import { getCommandCenterJobs } from "./command-center";

describe("getCommandCenterJobs", () => {
  it("puts unassigned jobs ahead of payment gaps", () => {
    const result = getCommandCenterJobs([
      { id: "payment", suggestedTeam: "JB 1", payment: "Unpaid", status: "Assigned" },
      { id: "assign", suggestedTeam: "Unassigned", payment: "Not recorded", status: "Booked" },
    ]);

    expect(result.attention.map((job) => job.id)).toEqual(["assign", "payment"]);
    expect(result.attention[0]?.issue).toBe("Assign");
  });

  it("keeps jobs without an exception in the on-track list", () => {
    const result = getCommandCenterJobs([
      { id: "on-track", suggestedTeam: "Melaka 1", payment: "Split", status: "In progress" },
    ]);

    expect(result.attention).toEqual([]);
    expect(result.onTrack[0]).toMatchObject({ id: "on-track", issue: "On track" });
  });
});
