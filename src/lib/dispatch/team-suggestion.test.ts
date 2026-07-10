import { describe, expect, it } from "vitest";

import { suggestTeamsForDispatch } from "./team-suggestion";

describe("suggestTeamsForDispatch", () => {
  it("prefers a matching service area before workload", () => {
    const suggestions = suggestTeamsForDispatch(
      [
        { id: "busy-johor", name: "Johor", region: "Johor", serviceAreaTags: ["Pasir Gudang"], activeJobs: 4 },
        { id: "idle-melaka", name: "Melaka", region: "Melaka", serviceAreaTags: ["Melaka"], activeJobs: 0 },
      ],
      { area: "Pasir Gudang", city: "Johor Bahru", state: "Johor", postcode: null },
    );

    expect(suggestions[0]).toMatchObject({ teamId: "busy-johor" });
    expect(suggestions[0]?.reason).toContain("Matches pasir gudang");
  });

  it("uses workload and then stable team id ordering when locations do not match", () => {
    const suggestions = suggestTeamsForDispatch(
      [
        { id: "b-team", name: "B", region: null, serviceAreaTags: [], activeJobs: 1 },
        { id: "a-team", name: "A", region: null, serviceAreaTags: [], activeJobs: 1 },
        { id: "busy-team", name: "Busy", region: null, serviceAreaTags: [], activeJobs: 3 },
      ],
      { area: "Nilai", city: null, state: null, postcode: null },
    );

    expect(suggestions.map((suggestion) => suggestion.teamId)).toEqual(["a-team", "b-team", "busy-team"]);
  });
});
