import { describe, expect, test } from "vitest";

import { canAccessSection, getDefaultRouteForRole, hasAnyRole } from "./permissions";

describe("auth permissions", () => {
  test("requires one of the allowed roles", () => {
    expect(hasAnyRole("ADMIN", ["ADMIN", "DISPATCHER"])).toBe(true);
    expect(hasAnyRole("TEAM_LEAD", ["ADMIN", "DISPATCHER"])).toBe(false);
    expect(hasAnyRole(undefined, ["ADMIN"])).toBe(false);
  });

  test("keeps the CEO on the dashboard-only observer surface", () => {
    expect(canAccessSection("ADMIN", "dashboard")).toBe(true);
    expect(canAccessSection("ADMIN", "intake")).toBe(false);
    expect(canAccessSection("ADMIN", "dispatch")).toBe(false);
    expect(canAccessSection("ADMIN", "jobs")).toBe(false);
    expect(canAccessSection("ADMIN", "finance")).toBe(false);
    expect(canAccessSection("ADMIN", "expenses")).toBe(false);
    expect(canAccessSection("ADMIN", "teamEntries")).toBe(false);
    expect(canAccessSection("ADMIN", "partner")).toBe(false);
  });

  test("reserves intake for data entry while allowing dispatch work", () => {
    expect(canAccessSection("DATA_ENTRY", "intake")).toBe(true);
    expect(canAccessSection("ADMIN", "intake")).toBe(false);
    expect(canAccessSection("DISPATCHER", "intake")).toBe(false);
    expect(canAccessSection("DATA_ENTRY", "dispatch")).toBe(true);
    expect(canAccessSection("PARTNER_VIEWER", "dispatch")).toBe(false);
  });

  test("routes each role to the right starting interface", () => {
    expect(getDefaultRouteForRole("ADMIN")).toBe("/");
    expect(getDefaultRouteForRole("DISPATCHER")).toBe("/dispatch");
    expect(getDefaultRouteForRole("DATA_ENTRY")).toBe("/team-entries");
    expect(getDefaultRouteForRole("TEAM_LEAD")).toBe("/team");
    expect(getDefaultRouteForRole("PARTNER_VIEWER")).toBe("/partner");
    expect(getDefaultRouteForRole("VIEWER")).toBe("/jobs");
  });
});
