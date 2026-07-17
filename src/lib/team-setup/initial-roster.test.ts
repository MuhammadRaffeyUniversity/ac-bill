import { describe, expect, it } from "vitest";

import { businessSetup } from "../config/business";
import { initialCommissionRules, initialTeamRoster } from "./initial-roster";

describe("initial team roster", () => {
  it("stores the confirmed salary amount and two-member team size in server configuration", () => {
    expect(businessSetup.salaryTeamMonthlyAmount).toBe(2000);
    expect(businessSetup.membersPerTeam).toBe(2);
  });

  it("contains the four confirmed teams with a three-to-one compensation split", () => {
    expect(initialTeamRoster.map((team) => team.name)).toEqual([
      "JB Team 1",
      "JB Team 2",
      "Melaka Team 1",
      "Ali & Zeeshan",
    ]);
    expect(
      initialTeamRoster.filter((team) => team.compensationType === "SALARY"),
    ).toHaveLength(3);
    expect(
      initialTeamRoster.filter(
        (team) => team.compensationType === "COMMISSION",
      ),
    ).toHaveLength(1);
  });

  it("keeps the confirmed members, areas, and database-owned rates", () => {
    expect(initialTeamRoster[0]).toMatchObject({
      region: "Johor Bahru",
      members: ["Nouman", "Khan"],
    });
    expect(initialTeamRoster[3]).toMatchObject({
      region: null,
      serviceAreaTags: [],
    });
    expect(initialCommissionRules).toContainEqual(
      expect.objectContaining({
        compensationType: "COMMISSION",
        teamRate: 0.6,
        partnerRate: 0.25,
        companyRate: 0.15,
      }),
    );
  });

  it("gives each initial global commission rule a stable seed identity", () => {
    expect(initialCommissionRules.map((rule) => rule.seedKey)).toEqual([
      "initial-global-salary",
      "initial-global-commission",
    ]);
  });
});
