import { describe, expect, test } from "vitest";

import { canAccessSection, getDefaultRouteForRole, hasAnyRole } from "./permissions";

describe("auth permissions", () => {
  test("requires one of the allowed roles", () => {
    expect(hasAnyRole("ADMIN", ["ADMIN", "DISPATCHER"])).toBe(true);
    expect(hasAnyRole("TEAM_LEAD", ["ADMIN", "DISPATCHER"])).toBe(false);
    expect(hasAnyRole(undefined, ["ADMIN"])).toBe(false);
  });

  test("keeps CEO finance reports admin-only", () => {
    expect(canAccessSection("ADMIN", "finance")).toBe(true);
    expect(canAccessSection("DISPATCHER", "finance")).toBe(false);
    expect(canAccessSection("TEAM_LEAD", "finance")).toBe(false);
  });

  test("allows operators to use intake and dispatch", () => {
    expect(canAccessSection("DISPATCHER", "intake")).toBe(true);
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
