import { describe, expect, it } from "vitest";

import { createTeamSchema, parseServiceAreaTags } from "./schema";

describe("team setup schema", () => {
  it("requires a team name and valid compensation type", () => {
    expect(createTeamSchema.safeParse({ name: "", compensationType: "SALARY" }).success).toBe(false);
    expect(createTeamSchema.safeParse({ name: "Johor South", compensationType: "SALARY" }).success).toBe(true);
  });

  it("normalizes duplicate service area tags", () => {
    expect(parseServiceAreaTags(" Pasir Gudang, Johor Bahru, Pasir Gudang ")).toEqual(["Pasir Gudang", "Johor Bahru"]);
  });
});
