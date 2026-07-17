import { describe, expect, it } from "vitest";

import { canCreateTeam, createTeamSchema, parseServiceAreaTags } from "./schema";

describe("team setup schema", () => {
  it("requires a team name and valid compensation type", () => {
    const members = { memberOneName: "A", memberTwoName: "B" };
    expect(createTeamSchema.safeParse({ name: "", compensationType: "SALARY", ...members }).success).toBe(false);
    expect(createTeamSchema.safeParse({ name: "Johor South", compensationType: "SALARY", ...members }).success).toBe(true);
  });

  it("requires two distinct member names", () => {
    const base = { name: "Johor South", compensationType: "SALARY" };
    expect(createTeamSchema.safeParse(base).success).toBe(false);
    expect(createTeamSchema.safeParse({ ...base, memberOneName: "A", memberTwoName: "A" }).success).toBe(false);
    expect(createTeamSchema.safeParse({ ...base, memberOneName: "A", memberTwoName: "B" }).success).toBe(true);
  });

  it("normalizes duplicate service area tags", () => {
    expect(parseServiceAreaTags(" Pasir Gudang, Johor Bahru, Pasir Gudang ")).toEqual(["Pasir Gudang", "Johor Bahru"]);
  });

  it("allows additional teams without a compensation cap", () => {
    expect(canCreateTeam()).toBe(true);
  });
});
