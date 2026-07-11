# Flexible Team Roster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed the four confirmed teams and let Data Entry add any further teams without hard-coded roster caps.

**Architecture:** Put the confirmed roster in a server-only, typed seed-data module and use idempotent Prisma upserts for teams, members, and compensation rules. Remove both the server-action and client-interface five-salary/one-commission limits; authorization remains enforced by the existing Data Entry route and action guard.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma 7, PostgreSQL, Vitest, Tailwind CSS.

## Global Constraints

- Initial active roster has exactly three Salary teams and one Commission team: `JB Team 1`, `JB Team 2`, `Melaka Team 1`, and `Ali & Zeeshan`.
- The current roster is intentionally temporary; Data Entry can add additional teams of either compensation type.
- Initial service areas are Johor Bahru for both JB teams and Melaka for Melaka Team 1; Ali & Zeeshan has no assumed region or service area.
- Seeded rates are Salary: sender 25%, team/company 0%; Commission: team 60%, sender 25%, company 15%.
- Team names and rates must not be embedded in UI components.
- CEO remains dashboard-only and Data Entry remains the only team-setup role.
- Preserve existing unrelated work in `Plan.md`, `app/ledger/`, `components/ledger/`, `src/lib/ledger/`, and `docs/plan-finish-checklist.md`.

---

### Task 1: Typed initial roster and deterministic seed

**Files:**
- Create: `src/lib/team-setup/initial-roster.ts`
- Create: `src/lib/team-setup/initial-roster.test.ts`
- Modify: `prisma/seed.ts`

**Interfaces:**
- Produces `initialTeamRoster`, an immutable list of `{ name, region, serviceAreaTags, compensationType, members }`.
- Produces `initialCommissionRules`, an immutable list of `{ compensationType, teamRate, partnerRate, companyRate }`.
- `prisma/seed.ts` consumes both lists and upserts `Team`, `TeamMember`, and global `CommissionRule` records.

- [ ] **Step 1: Write the failing roster test**

```ts
import { describe, expect, it } from "vitest";
import { initialCommissionRules, initialTeamRoster } from "./initial-roster";

describe("initial team roster", () => {
  it("contains the four confirmed teams with a three-to-one compensation split", () => {
    expect(initialTeamRoster.map((team) => team.name)).toEqual([
      "JB Team 1", "JB Team 2", "Melaka Team 1", "Ali & Zeeshan",
    ]);
    expect(initialTeamRoster.filter((team) => team.compensationType === "SALARY")).toHaveLength(3);
    expect(initialTeamRoster.filter((team) => team.compensationType === "COMMISSION")).toHaveLength(1);
  });

  it("keeps the confirmed members, areas, and database-owned rates", () => {
    expect(initialTeamRoster[0]).toMatchObject({ region: "Johor Bahru", members: ["Nouman", "Khan"] });
    expect(initialTeamRoster[3]).toMatchObject({ region: null, serviceAreaTags: [] });
    expect(initialCommissionRules).toContainEqual({ compensationType: "COMMISSION", teamRate: 0.6, partnerRate: 0.25, companyRate: 0.15 });
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails because the roster module is absent**

Run: `pnpm test src/lib/team-setup/initial-roster.test.ts`

Expected: FAIL with module-not-found for `./initial-roster`.

- [ ] **Step 3: Add the smallest typed roster module**

```ts
import type { CompensationType } from "@/src/generated/prisma/enums";

export const initialTeamRoster = [
  { name: "JB Team 1", region: "Johor Bahru", serviceAreaTags: ["Johor Bahru"], compensationType: "SALARY", members: ["Nouman", "Khan"] },
  { name: "JB Team 2", region: "Johor Bahru", serviceAreaTags: ["Johor Bahru"], compensationType: "SALARY", members: ["Ayaz Khan", "Yousaf Khan"] },
  { name: "Melaka Team 1", region: "Melaka", serviceAreaTags: ["Melaka"], compensationType: "SALARY", members: ["Zubair", "Rehman"] },
  { name: "Ali & Zeeshan", region: null, serviceAreaTags: [], compensationType: "COMMISSION", members: ["Ali", "Zeeshan"] },
] as const satisfies readonly { name: string; region: string | null; serviceAreaTags: readonly string[]; compensationType: CompensationType; members: readonly string[] }[];

export const initialCommissionRules = [
  { compensationType: "SALARY", teamRate: 0, partnerRate: 0.25, companyRate: 0 },
  { compensationType: "COMMISSION", teamRate: 0.6, partnerRate: 0.25, companyRate: 0.15 },
] as const satisfies readonly { compensationType: CompensationType; teamRate: number; partnerRate: number; companyRate: number }[];
```

- [ ] **Step 4: Re-run the roster test**

Run: `pnpm test src/lib/team-setup/initial-roster.test.ts`

Expected: PASS with two tests.

- [ ] **Step 5: Update the seed to upsert roster records**

Replace the final placeholder log with a loop that locates each seeded team using `findFirst({ where: { name } })`, then updates or creates it. For each resulting team ID, upsert its confirmed members by the composite identity of name and team ID. Locate the current global rule using `findFirst({ where: { teamId: null, compensationType, effectiveTo: null } })`, then update or create it. Do not delete non-seeded teams or their members. Convert numeric rates to Prisma Decimal-compatible values as required by the generated client.

- [ ] **Step 6: Verify generated Prisma types and all roster tests**

Run: `pnpm db:generate && pnpm test src/lib/team-setup/initial-roster.test.ts src/lib/team-setup/schema.test.ts`

Expected: Prisma generation exits 0; all listed tests pass.

### Task 2: Unlimited Data Entry team setup

**Files:**
- Modify: `src/lib/team-setup/actions.ts`
- Modify: `components/team-setup/team-setup-workspace.tsx`
- Modify: `src/lib/team-setup/schema.test.ts`

**Interfaces:**
- `createTeam` remains `(_previousState: TeamSetupActionState, formData: FormData) => Promise<TeamSetupActionState>`.
- `TeamSetupWorkspace` continues accepting the existing `teams` prop; it no longer receives or derives caps.

- [ ] **Step 1: Write a failing test for an uncapped setup policy**

Add an exported pure helper to the schema test contract and write:

```ts
import { canCreateTeam } from "./schema";

it("allows an additional team for either compensation type", () => {
  expect(canCreateTeam("SALARY")).toBe(true);
  expect(canCreateTeam("COMMISSION")).toBe(true);
});
```

- [ ] **Step 2: Run the test and confirm it fails because `canCreateTeam` is absent**

Run: `pnpm test src/lib/team-setup/schema.test.ts`

Expected: FAIL with no exported member `canCreateTeam`.

- [ ] **Step 3: Implement the policy and remove hard caps**

```ts
export function canCreateTeam(_compensationType: "SALARY" | "COMMISSION") {
  return true;
}
```

Delete `teamLimits`, the active-count query, and its limit error from `createTeam`. In `TeamSetupWorkspace`, import `canCreateTeam`, use it to set both compensation options’ disabled state, remove `canAddSalary`, `canAddCommission`, cap badges, and `x of y active` copy. Replace the section descriptions with active counts and copy that makes Data Entry’s ability to add teams clear.

- [ ] **Step 4: Re-run the focused test**

Run: `pnpm test src/lib/team-setup/schema.test.ts`

Expected: PASS with the existing validation/tag tests and the new uncapped-policy test.

- [ ] **Step 5: Typecheck the client/server boundary**

Run: `pnpm typecheck`

Expected: exit 0 with no TypeScript errors.

### Task 3: Align plan documentation and verify role access

**Files:**
- Modify: `Plan.md`
- Modify: `app/team-setup/page.tsx`
- Modify: `src/lib/auth/permissions.ts`
- Modify: `src/lib/auth/permissions.test.ts`

**Interfaces:**
- Existing `canAccessSection(role, section)` and `getAllowedRolesForSection(section)` remain the access-control test seams.

- [ ] **Step 1: Write a failing access assertion for the team setup decision**

Add the `teamSetup` section to the test contract and write:

```ts
test("reserves team setup for Data Entry", () => {
  expect(canAccessSection("DATA_ENTRY", "teamSetup")).toBe(true);
  expect(canAccessSection("ADMIN", "teamSetup")).toBe(false);
});
```

- [ ] **Step 2: Run the focused test and confirm the missing coverage fails**

Run: `pnpm test src/lib/auth/permissions.test.ts`

Expected: FAIL because `teamSetup` is not yet a valid application section.

- [ ] **Step 3: Make the smallest access/documentation change**

Add `teamSetup: ["DATA_ENTRY"]` to `sectionRoles`. Replace the page literal with `requireRole(getAllowedRolesForSection("teamSetup"))`, so the tested permission definition also protects the route. Update only the stale `Plan.md` roster statements: replace the fixed six-team requirement with the current four confirmed teams plus Data Entry-managed expansion, and list the outstanding final-roster decision explicitly.

- [ ] **Step 4: Run focused authorization and documentation checks**

Run: `pnpm test src/lib/auth/permissions.test.ts && rg -n "six active teams|5 salary teams and 1 commission team" Plan.md`

Expected: permission tests pass; remaining fixed-six references are either removed or explicitly historical workbook context, not active implementation requirements.

### Task 4: Full verification and browser proof

**Files:**
- Modify: `docs/plan-finish-checklist.md`

**Interfaces:**
- No production interface changes.

- [ ] **Step 1: Run the full automated verification set**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`

Expected: every command exits 0 with no lint warnings.

- [ ] **Step 2: Run the app and browser-test the Data Entry flow**

Run: `pnpm dev`

Expected: the local application starts. Sign in as a Data Entry user, visit `/team-setup`, verify all four seeded teams display, add a fifth team, and confirm it appears with no cap-related error. Sign in as CEO and verify `/team-setup` redirects to the dashboard.

- [ ] **Step 3: Update only evidence-backed checklist items**

Mark the team-seeding portion of the P0 seed item complete only after the database seed and browser flow have been verified. Keep all unrelated checklist items unchecked, including workbook import and unresolved financial decisions.
