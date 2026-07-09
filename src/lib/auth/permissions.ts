import type { UserRole } from "@/src/generated/prisma/enums";

export type AppSection =
  | "dashboard"
  | "intake"
  | "dispatch"
  | "jobs"
  | "finance"
  | "expenses"
  | "team"
  | "teamEntries"
  | "partner";

const sectionRoles = {
  dashboard: ["ADMIN"],
  intake: ["ADMIN", "DISPATCHER", "DATA_ENTRY"],
  dispatch: ["ADMIN", "DISPATCHER", "DATA_ENTRY"],
  jobs: ["ADMIN", "DISPATCHER", "DATA_ENTRY", "TEAM_LEAD", "VIEWER"],
  finance: ["ADMIN"],
  expenses: ["ADMIN", "DATA_ENTRY"],
  team: ["TEAM_LEAD"],
  teamEntries: ["ADMIN", "DATA_ENTRY"],
  partner: ["ADMIN", "PARTNER_VIEWER"],
} satisfies Record<AppSection, UserRole[]>;

const defaultRoutes = {
  ADMIN: "/",
  DISPATCHER: "/dispatch",
  DATA_ENTRY: "/team-entries",
  TEAM_LEAD: "/team",
  PARTNER_VIEWER: "/partner",
  VIEWER: "/jobs",
} satisfies Record<UserRole, string>;

export function hasAnyRole(role: UserRole | undefined, allowedRoles: readonly UserRole[]) {
  return Boolean(role && allowedRoles.includes(role));
}

export function canAccessSection(role: UserRole | undefined, section: AppSection) {
  return hasAnyRole(role, sectionRoles[section]);
}

export function getDefaultRouteForRole(role: UserRole) {
  return defaultRoutes[role];
}

export function getAllowedRolesForSection(section: AppSection) {
  return sectionRoles[section];
}
