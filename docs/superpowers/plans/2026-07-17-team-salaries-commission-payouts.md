# Team Salaries and Commission Payouts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic member-level salary and commission obligations, full payout settlements, Data Entry controls, and CEO read-only payout reporting.

**Architecture:** Store amounts owed in immutable, uniquely sourced `PayoutObligation` rows and actual settlement in one-to-one `Payout` rows. Generate salary obligations idempotently by Malaysia calendar month, create commission obligations atomically with invoice issuance, and expose mutations only through authenticated Data Entry server actions.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 7, PostgreSQL/Neon, Zod 4, Auth.js, Vitest, shadcn UI, Tailwind CSS v4.

## Global Constraints

- Preserve all unrelated working-tree changes; stage only files named by the current task.
- Never inspect `.env`, `.env.local`, or any other secret file.
- Salary teams receive RM 2,000 per month, split into RM 1,000 per each of exactly two active members.
- Commission teams receive 60% of commissionable sales, split equally into 30% per each of exactly two active members.
- If the team share has an odd cent, the alphabetically first active member receives the extra RM 0.01 so member obligations still total the full 60%.
- The sender receives 25% and the company receives 15%.
- Commissionable sales equal invoice subtotal minus discount; tax is excluded.
- Commission obligations are created when the invoice is issued, regardless of customer payment status.
- Payouts settle an obligation in full; partial payout entry is not allowed.
- Data Entry records payouts. CEO/admin receives read-only aggregates only.
- CEO payout aggregates always represent the current Malaysia calendar month and do not change with the operational Today/7 days/30 days filter.
- Dispatcher, team lead, viewer, partner viewer, and public routes must not expose internal payouts.
- Financial math is deterministic, server-side, cent-safe, and covered by tests.
- LLM code must never calculate or save salaries, commissions, or payouts.

---

### Task 1: Lock the compensation calculations with failing tests

**Files:**

- Create: `src/lib/payouts/calculations.test.ts`
- Create: `src/lib/payouts/calculations.ts`

**Interfaces:**

- Consumes: member IDs, monthly team salary, invoice subtotal, invoice discount, and effective commission rates.
- Produces:
  - `calculateCommissionableSales(input: { subtotal: number; discount: number }): number`
  - `allocateSalaryToMembers(input: { monthlyTeamSalary: number; memberIds: readonly [string, string] }): MemberAllocation`
  - `allocateCommissionToMembers(input: CommissionAllocationInput): CommissionAllocation`
  - `validateFullPayout(input: { obligationAmount: number; payoutAmount: number }): boolean`

- [ ] **Step 1: Write the failing calculation tests**

```ts
import { describe, expect, it } from "vitest";
import {
  allocateCommissionToMembers,
  allocateSalaryToMembers,
  calculateCommissionableSales,
  validateFullPayout,
} from "./calculations";

describe("team payouts", () => {
  it("splits RM 2,000 equally between two salary-team members", () => {
    expect(allocateSalaryToMembers({
      monthlyTeamSalary: 2000,
      memberIds: ["member-a", "member-b"],
    })).toEqual({
      total: 2000,
      members: [
        { memberId: "member-a", amount: 1000 },
        { memberId: "member-b", amount: 1000 },
      ],
    });
  });

  it("splits RM 560 into 30/30/25/15 commission shares", () => {
    expect(allocateCommissionToMembers({
      commissionableSales: 560,
      memberIds: ["ali", "zeeshan"],
      teamRate: 0.6,
      partnerRate: 0.25,
      companyRate: 0.15,
    })).toEqual({
      sales: 560,
      teamShare: 336,
      partnerShare: 140,
      companyShare: 84,
      members: [
        { memberId: "ali", amount: 168 },
        { memberId: "zeeshan", amount: 168 },
      ],
    });
  });

  it("gives an indivisible team-share cent to the first member", () => {
    expect(allocateCommissionToMembers({
      commissionableSales: 100.01,
      memberIds: ["first", "second"],
      teamRate: 0.6,
      partnerRate: 0.25,
      companyRate: 0.15,
    }).members).toEqual([
      { memberId: "first", amount: 30.01 },
      { memberId: "second", amount: 30 },
    ]);
  });

  it("uses subtotal after discount and excludes tax", () => {
    expect(calculateCommissionableSales({ subtotal: 600, discount: 40 })).toBe(560);
  });

  it("accepts only an exact full payout", () => {
    expect(validateFullPayout({ obligationAmount: 1000, payoutAmount: 1000 })).toBe(true);
    expect(validateFullPayout({ obligationAmount: 1000, payoutAmount: 500 })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run `pnpm exec vitest run src/lib/payouts/calculations.test.ts`.

Expected: FAIL because `./calculations` does not exist.

- [ ] **Step 3: Implement cent-safe calculations**

```ts
type MemberAllocation = {
  total: number;
  members: Array<{ memberId: string; amount: number }>;
};

type CommissionAllocationInput = {
  commissionableSales: number;
  memberIds: readonly [string, string];
  teamRate: number;
  partnerRate: number;
  companyRate: number;
};

const toCents = (value: number) => Math.round((value + Number.EPSILON) * 100);
const fromCents = (value: number) => value / 100;

export function calculateCommissionableSales({ subtotal, discount }: { subtotal: number; discount: number }) {
  return fromCents(toCents(subtotal) - toCents(discount));
}

export function allocateSalaryToMembers({ monthlyTeamSalary, memberIds }: {
  monthlyTeamSalary: number;
  memberIds: readonly [string, string];
}): MemberAllocation {
  const totalCents = toCents(monthlyTeamSalary);
  if (totalCents <= 0 || totalCents % 2 !== 0) throw new Error("Salary must split equally between two members.");
  const memberAmount = fromCents(totalCents / 2);
  return { total: fromCents(totalCents), members: memberIds.map((memberId) => ({ memberId, amount: memberAmount })) };
}

export function allocateCommissionToMembers(input: CommissionAllocationInput) {
  const rateTotal = input.teamRate + input.partnerRate + input.companyRate;
  if (Math.abs(rateTotal - 1) > 0.000001) throw new Error("Commission rates must total 100%.");
  const salesCents = toCents(input.commissionableSales);
  const teamCents = Math.round(salesCents * input.teamRate);
  const partnerCents = Math.round(salesCents * input.partnerRate);
  const companyCents = salesCents - teamCents - partnerCents;
  const firstMemberCents = Math.ceil(teamCents / 2);
  const secondMemberCents = teamCents - firstMemberCents;
  return {
    sales: fromCents(salesCents),
    teamShare: fromCents(teamCents),
    partnerShare: fromCents(partnerCents),
    companyShare: fromCents(companyCents),
    members: [
      { memberId: input.memberIds[0], amount: fromCents(firstMemberCents) },
      { memberId: input.memberIds[1], amount: fromCents(secondMemberCents) },
    ],
  };
}

export function validateFullPayout({ obligationAmount, payoutAmount }: { obligationAmount: number; payoutAmount: number }) {
  return toCents(obligationAmount) === toCents(payoutAmount);
}
```

- [ ] **Step 4: Verify GREEN**

Run `pnpm exec vitest run src/lib/payouts/calculations.test.ts`.

Expected: PASS with five tests.

- [ ] **Step 5: Commit the calculation boundary**

```powershell
git add -- src/lib/payouts/calculations.ts src/lib/payouts/calculations.test.ts
git commit -m "feat: add deterministic team payout calculations"
```

### Task 2: Add payout persistence and migration contracts

**Files:**

- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`
- Modify: `src/lib/config/business.ts`
- Modify: `src/lib/team-setup/initial-roster.test.ts`
- Create: `prisma/migrations/20260717190000_add_team_payouts/migration.sql`
- Create: `src/lib/payouts/persistence-contract.test.ts`

**Interfaces:**

- Consumes: existing `Team`, `TeamMember`, `Invoice`, `User`, `PaymentMethod`, and seed roster.
- Produces: `PayoutObligationType`, `PayoutObligationStatus`, `PayoutObligation`, `Payout`, and `Team.monthlySalaryAmount`.

- [ ] **Step 1: Write the failing persistence contract**

```ts
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync(new URL("../../../prisma/schema.prisma", import.meta.url), "utf8");
const migrationUrl = new URL("../../../prisma/migrations/20260717190000_add_team_payouts/migration.sql", import.meta.url);
const migration = existsSync(migrationUrl) ? readFileSync(migrationUrl, "utf8") : "";

describe("payout persistence", () => {
  it("stores member obligations and one full settlement", () => {
    expect(schema).toContain("enum PayoutObligationType");
    expect(schema).toContain("enum PayoutObligationStatus");
    expect(schema).toContain("model PayoutObligation");
    expect(schema).toContain("sourceKey");
    expect(schema).toContain("@unique");
    expect(schema).toContain("model Payout");
    expect(schema).toContain("obligationId");
  });

  it("adds database uniqueness for sources and settlements", () => {
    expect(migration).toContain('CREATE UNIQUE INDEX "PayoutObligation_sourceKey_key"');
    expect(migration).toContain('CREATE UNIQUE INDEX "Payout_obligationId_key"');
  });
});
```

- [ ] **Step 2: Run the contract and verify RED**

Run `pnpm exec vitest run src/lib/payouts/persistence-contract.test.ts`.

Expected: FAIL because the migration and models do not exist.

- [ ] **Step 3: Add schema enums, fields, relations, and models**

Add:

```prisma
enum PayoutObligationType {
  SALARY
  COMMISSION
}

enum PayoutObligationStatus {
  DUE
  PAID
  VOID
}

model PayoutObligation {
  id           String                  @id @default(cuid())
  type         PayoutObligationType
  status       PayoutObligationStatus  @default(DUE)
  teamId       String
  teamMemberId String
  invoiceId    String?
  periodKey    String?
  sourceKey    String                  @unique
  amount       Decimal                 @db.Decimal(12, 2)
  earnedAt     DateTime
  voidedAt     DateTime?
  voidReason   String?
  createdAt    DateTime                @default(now())
  updatedAt    DateTime                @updatedAt
  team         Team                    @relation(fields: [teamId], references: [id])
  teamMember   TeamMember              @relation(fields: [teamMemberId], references: [id])
  invoice      Invoice?                @relation(fields: [invoiceId], references: [id])
  payout       Payout?

  @@index([type, status, earnedAt])
  @@index([teamId, periodKey])
  @@index([teamMemberId, earnedAt])
  @@index([invoiceId])
}

model Payout {
  id              String            @id @default(cuid())
  obligationId    String            @unique
  amount          Decimal           @db.Decimal(12, 2)
  method          PaymentMethod
  referenceNumber String?
  note            String?
  paidAt          DateTime
  recordedById    String
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  obligation      PayoutObligation  @relation(fields: [obligationId], references: [id])
  recordedBy      User              @relation(fields: [recordedById], references: [id])

  @@index([recordedById, paidAt])
  @@index([paidAt])
}
```

Add `monthlySalaryAmount Decimal? @db.Decimal(12, 2)` and obligation relations to `Team`; obligation relations to `TeamMember` and `Invoice`; and `recordedPayouts Payout[]` to `User`.

- [ ] **Step 4: Add the SQL migration**

```sql
CREATE TYPE "PayoutObligationType" AS ENUM ('SALARY', 'COMMISSION');
CREATE TYPE "PayoutObligationStatus" AS ENUM ('DUE', 'PAID', 'VOID');

ALTER TABLE "Team" ADD COLUMN "monthlySalaryAmount" DECIMAL(12,2);
UPDATE "Team"
SET "monthlySalaryAmount" = 2000.00
WHERE "compensationType" = 'SALARY';

CREATE TABLE "PayoutObligation" (
  "id" TEXT NOT NULL,
  "type" "PayoutObligationType" NOT NULL,
  "status" "PayoutObligationStatus" NOT NULL DEFAULT 'DUE',
  "teamId" TEXT NOT NULL,
  "teamMemberId" TEXT NOT NULL,
  "invoiceId" TEXT,
  "periodKey" TEXT,
  "sourceKey" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "earnedAt" TIMESTAMP(3) NOT NULL,
  "voidedAt" TIMESTAMP(3),
  "voidReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PayoutObligation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payout" (
  "id" TEXT NOT NULL,
  "obligationId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "referenceNumber" TEXT,
  "note" TEXT,
  "paidAt" TIMESTAMP(3) NOT NULL,
  "recordedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayoutObligation_sourceKey_key" ON "PayoutObligation"("sourceKey");
CREATE INDEX "PayoutObligation_type_status_earnedAt_idx" ON "PayoutObligation"("type", "status", "earnedAt");
CREATE INDEX "PayoutObligation_teamId_periodKey_idx" ON "PayoutObligation"("teamId", "periodKey");
CREATE INDEX "PayoutObligation_teamMemberId_earnedAt_idx" ON "PayoutObligation"("teamMemberId", "earnedAt");
CREATE INDEX "PayoutObligation_invoiceId_idx" ON "PayoutObligation"("invoiceId");
CREATE UNIQUE INDEX "Payout_obligationId_key" ON "Payout"("obligationId");
CREATE INDEX "Payout_recordedById_paidAt_idx" ON "Payout"("recordedById", "paidAt");
CREATE INDEX "Payout_paidAt_idx" ON "Payout"("paidAt");

ALTER TABLE "PayoutObligation"
ADD CONSTRAINT "PayoutObligation_teamId_fkey"
FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PayoutObligation"
ADD CONSTRAINT "PayoutObligation_teamMemberId_fkey"
FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PayoutObligation"
ADD CONSTRAINT "PayoutObligation_invoiceId_fkey"
FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payout"
ADD CONSTRAINT "Payout_obligationId_fkey"
FOREIGN KEY ("obligationId") REFERENCES "PayoutObligation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payout"
ADD CONSTRAINT "Payout_recordedById_fkey"
FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

- [ ] **Step 5: Store salary defaults in server configuration and seed data**

Add:

```ts
salaryTeamMonthlyAmount: 2000,
membersPerTeam: 2,
```

to `businessSetup`. Update `prisma/seed.ts` so salary teams upsert `monthlySalaryAmount: "2000.00"` and commission teams upsert `null`.

Extend `initial-roster.test.ts`:

```ts
expect(businessSetup.salaryTeamMonthlyAmount).toBe(2000);
expect(businessSetup.membersPerTeam).toBe(2);
```

- [ ] **Step 6: Generate Prisma and verify GREEN**

Run:

```powershell
pnpm db:generate
pnpm exec vitest run src/lib/payouts/persistence-contract.test.ts src/lib/team-setup/initial-roster.test.ts
```

Expected: Prisma generation exits 0 and both test files pass.

- [ ] **Step 7: Commit persistence**

```powershell
git add -- prisma/schema.prisma prisma/seed.ts prisma/migrations/20260717190000_add_team_payouts/migration.sql src/lib/config/business.ts src/lib/team-setup/initial-roster.test.ts src/lib/payouts/persistence-contract.test.ts src/generated/prisma
git commit -m "feat: add payout obligation persistence"
```

### Task 3: Require two members when creating teams

**Files:**

- Modify: `src/lib/team-setup/schema.ts`
- Modify: `src/lib/team-setup/schema.test.ts`
- Modify: `src/lib/team-setup/actions.ts`
- Modify: `app/(data-entry)/team-setup/page.tsx`
- Modify: `components/team-setup/team-setup-workspace.tsx`

**Interfaces:**

- Consumes: `businessSetup.salaryTeamMonthlyAmount` and Data Entry role.
- Produces: `CreateTeamInput` with `memberOneName` and `memberTwoName`; transactional team/member creation; team rows containing active member names.

- [ ] **Step 1: Add failing schema tests**

```ts
it("requires two distinct member names", () => {
  const base = { name: "Johor South", compensationType: "SALARY" };
  expect(createTeamSchema.safeParse(base).success).toBe(false);
  expect(createTeamSchema.safeParse({ ...base, memberOneName: "A", memberTwoName: "A" }).success).toBe(false);
  expect(createTeamSchema.safeParse({ ...base, memberOneName: "A", memberTwoName: "B" }).success).toBe(true);
});
```

- [ ] **Step 2: Verify RED**

Run `pnpm exec vitest run src/lib/team-setup/schema.test.ts`.

Expected: FAIL because member names are not required.

- [ ] **Step 3: Extend the Zod schema**

```ts
export const createTeamSchema = z.object({
  name: z.string().trim().min(2).max(100),
  region: z.string().trim().max(100).optional().or(z.literal("")),
  compensationType: z.enum(["SALARY", "COMMISSION"]),
  serviceAreaTags: z.string().trim().max(500).optional().or(z.literal("")),
  memberOneName: z.string().trim().min(1, "Enter the first member.").max(100),
  memberTwoName: z.string().trim().min(1, "Enter the second member.").max(100),
}).refine(
  (data) => data.memberOneName.toLocaleLowerCase() !== data.memberTwoName.toLocaleLowerCase(),
  { path: ["memberTwoName"], message: "Team members must be different people." },
);
```

- [ ] **Step 4: Create the team and members atomically**

Parse both names from `FormData`, then:

```ts
await db.$transaction(async (tx) => {
  await tx.team.create({
    data: {
      name: data.name,
      region: data.region || undefined,
      compensationType: data.compensationType as CompensationType,
      monthlySalaryAmount: data.compensationType === "SALARY"
        ? businessSetup.salaryTeamMonthlyAmount
        : null,
      defaultMembers: [data.memberOneName, data.memberTwoName],
      serviceAreaTags: parseServiceAreaTags(data.serviceAreaTags || ""),
      members: {
        create: [
          { name: data.memberOneName, active: true },
          { name: data.memberTwoName, active: true },
        ],
      },
    },
  });
});
```

- [ ] **Step 5: Add two member fields and display active members**

Select `members: { where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }` on the page. Add `memberOneName` and `memberTwoName` inputs to the form and render `team.members.map(({ name }) => name).join(" & ")` in `TeamRow`.

- [ ] **Step 6: Verify GREEN**

Run `pnpm exec vitest run src/lib/team-setup/schema.test.ts src/lib/team-setup/initial-roster.test.ts`.

Expected: PASS.

- [ ] **Step 7: Commit team invariants**

```powershell
git add -- src/lib/team-setup/schema.ts src/lib/team-setup/schema.test.ts src/lib/team-setup/actions.ts app/(data-entry)/team-setup/page.tsx components/team-setup/team-setup-workspace.tsx
git commit -m "feat: require two members per team"
```

### Task 4: Generate monthly salary obligations idempotently

**Files:**

- Create: `src/lib/payouts/month.ts`
- Create: `src/lib/payouts/month.test.ts`
- Create: `src/lib/payouts/salary-obligations.ts`
- Create: `src/lib/payouts/salary-obligations.test.ts`

**Interfaces:**

- Consumes: `YYYY-MM`, active salary teams, two active members, and `monthlySalaryAmount`.
- Produces:
  - `parsePayoutMonth(value: string | undefined, now?: Date): string`
  - `getPayoutMonthRange(periodKey: string): { rangeStart: Date; rangeEnd: Date }`
  - `salarySourceKey(teamId: string, memberId: string, periodKey: string): string`
  - `buildSalaryObligationDrafts(team: SalaryTeamInput, periodKey: string): SalaryObligationDraft[]`
  - `ensureSalaryObligations(periodKey: string): Promise<SalaryGenerationResult>`

- [ ] **Step 1: Write failing month and draft tests**

```ts
expect(parsePayoutMonth("2026-07")).toBe("2026-07");
expect(parsePayoutMonth("not-a-month", new Date("2026-07-17T00:00:00+08:00"))).toBe("2026-07");
expect(salarySourceKey("team", "member", "2026-07")).toBe("salary:team:member:2026-07");

expect(buildSalaryObligationDrafts({
  id: "team",
  monthlySalaryAmount: 2000,
  members: [{ id: "a" }, { id: "b" }],
}, "2026-07")).toEqual([
  expect.objectContaining({ sourceKey: "salary:team:a:2026-07", amount: 1000 }),
  expect.objectContaining({ sourceKey: "salary:team:b:2026-07", amount: 1000 }),
]);

expect(() => buildSalaryObligationDrafts({
  id: "team",
  monthlySalaryAmount: 2000,
  members: [{ id: "a" }],
}, "2026-07")).toThrow("exactly two active members");
```

- [ ] **Step 2: Verify RED**

Run `pnpm exec vitest run src/lib/payouts/month.test.ts src/lib/payouts/salary-obligations.test.ts`.

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement Malaysia month parsing and salary drafts**

```ts
const payoutMonthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

export function parsePayoutMonth(value: string | undefined, now = new Date()) {
  if (value && payoutMonthPattern.test(value)) return value;
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  if (!year || !month) throw new Error("Unable to resolve the Malaysia payout month.");
  return `${year}-${month}`;
}

export function getPayoutMonthRange(periodKey: string) {
  if (!payoutMonthPattern.test(periodKey)) throw new Error("Invalid payout month.");
  const [year, month] = periodKey.split("-").map(Number);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return {
    rangeStart: new Date(`${periodKey}-01T00:00:00+08:00`),
    rangeEnd: new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+08:00`),
  };
}

export function salarySourceKey(teamId: string, memberId: string, periodKey: string) {
  return `salary:${teamId}:${memberId}:${periodKey}`;
}
```

Build drafts with:

```ts
export function buildSalaryObligationDrafts(team: SalaryTeamInput, periodKey: string) {
  if (team.members.length !== 2) throw new Error("Salary teams require exactly two active members.");
  if (team.monthlySalaryAmount == null) throw new Error("Monthly salary is not configured.");
  const [first, second] = team.members;
  const allocation = allocateSalaryToMembers({
    monthlyTeamSalary: team.monthlySalaryAmount,
    memberIds: [first.id, second.id],
  });
  const { rangeStart } = getPayoutMonthRange(periodKey);
  return allocation.members.map((member) => ({
    type: PayoutObligationType.SALARY,
    status: PayoutObligationStatus.DUE,
    teamId: team.id,
    teamMemberId: member.memberId,
    periodKey,
    sourceKey: salarySourceKey(team.id, member.memberId, periodKey),
    amount: member.amount,
    earnedAt: rangeStart,
  }));
}
```

- [ ] **Step 4: Implement idempotent persistence**

`ensureSalaryObligations` loads active salary teams with active members and processes every team independently:

```ts
await db.payoutObligation.createMany({
  data: drafts,
  skipDuplicates: true,
});
```

Return `{ createdCount, exceptions: Array<{ teamId; teamName; message }> }`. Invalid teams appear as exceptions and do not prevent valid-team inserts.

- [ ] **Step 5: Verify GREEN**

Run `pnpm exec vitest run src/lib/payouts/month.test.ts src/lib/payouts/salary-obligations.test.ts`.

Expected: PASS.

- [ ] **Step 6: Commit salary generation**

```powershell
git add -- src/lib/payouts/month.ts src/lib/payouts/month.test.ts src/lib/payouts/salary-obligations.ts src/lib/payouts/salary-obligations.test.ts
git commit -m "feat: generate monthly salary obligations"
```

### Task 5: Create commission entries and member obligations with invoices

**Files:**

- Modify: `src/lib/billing/actions.ts`
- Modify: `src/lib/billing/actions-flow.test.ts`
- Create: `src/lib/payouts/commission-obligations.ts`
- Create: `src/lib/payouts/commission-obligations.test.ts`

**Interfaces:**

- Consumes: invoice totals, assigned team, active members, source partner, and effective `CommissionRule`.
- Produces:
  - `commissionSourceKey(invoiceId: string, memberId: string): string`
  - `buildCommissionRecords(input): { commissionEntry; obligations }`
  - invoice transaction containing `CommissionEntry` and commission-team obligations.

- [ ] **Step 1: Add failing commission-record tests**

```ts
expect(commissionSourceKey("invoice", "ali")).toBe("commission:invoice:ali");
expect(buildCommissionRecords({
  invoiceId: "invoice",
  jobId: "job",
  teamId: "team",
  partnerId: "partner",
  subtotal: 600,
  discount: 40,
  members: [{ id: "ali" }, { id: "zeeshan" }],
  rates: { teamRate: 0.6, partnerRate: 0.25, companyRate: 0.15 },
  earnedAt: new Date("2026-07-17T00:00:00Z"),
})).toMatchObject({
  commissionEntry: {
    salesAmount: 560,
    teamAmount: 336,
    partnerAmount: 140,
    companyAmount: 84,
  },
  obligations: [
    { teamMemberId: "ali", amount: 168 },
    { teamMemberId: "zeeshan", amount: 168 },
  ],
});
```

Extend `actions-flow.test.ts`:

```ts
expect(source).toContain("tx.commissionEntry.create");
expect(source).toContain("tx.payoutObligation.createMany");
expect(source).toContain("sourcePartnerId");
expect(source).toContain("commissionRules");
expect(source).toContain("COMMISSION_CONFIGURATION_INVALID");
```

- [ ] **Step 2: Verify RED**

Run `pnpm exec vitest run src/lib/payouts/commission-obligations.test.ts src/lib/billing/actions-flow.test.ts`.

Expected: FAIL because commission records are not part of invoice issuance.

- [ ] **Step 3: Implement record construction**

Use `calculateCommissionableSales` and `allocateCommissionToMembers`. For commission teams return two `COMMISSION` obligations. For salary teams return no team obligations and a `CommissionEntry` with `teamAmount: 0`, `partnerAmount: 25%`, and `companyAmount` equal to commissionable sales minus partner share.

- [ ] **Step 4: Extend invoice preconditions**

Inside the existing transaction, reload the job with:

```ts
select: {
  id: true,
  sourcePartnerId: true,
  assignedTeam: {
    select: {
      id: true,
      compensationType: true,
      members: { where: { active: true }, orderBy: [{ name: "asc" }, { id: "asc" }], select: { id: true } },
      commissionRules: {
        where: { effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] },
        orderBy: { effectiveFrom: "desc" },
        take: 1,
        select: { teamRate: true, partnerRate: true, companyRate: true },
      },
    },
  },
}
```

If the team has no team-specific rule, load the active global rule for its `compensationType`. Require source partner, assigned team, exactly two commission-team members, and the confirmed rates. Throw `COMMISSION_CONFIGURATION_INVALID` with a user-facing setup message.

- [ ] **Step 5: Create all financial records before commit**

After `tx.invoice.create`, call `buildCommissionRecords`, then:

```ts
await tx.commissionEntry.create({ data: records.commissionEntry });
if (records.obligations.length) {
  await tx.payoutObligation.createMany({ data: records.obligations });
}
```

Keep invoice, feedback, customer payments, `CommissionEntry`, and obligations in the same `db.$transaction`.

- [ ] **Step 6: Verify GREEN**

Run `pnpm exec vitest run src/lib/payouts/commission-obligations.test.ts src/lib/billing/actions-flow.test.ts src/lib/billing/calculations.test.ts`.

Expected: PASS.

- [ ] **Step 7: Commit atomic commission creation**

```powershell
git add -- src/lib/billing/actions.ts src/lib/billing/actions-flow.test.ts src/lib/payouts/commission-obligations.ts src/lib/payouts/commission-obligations.test.ts
git commit -m "feat: create commission payouts with invoices"
```

### Task 6: Add the Data Entry payout workspace and full settlement action

**Files:**

- Modify: `src/lib/auth/permissions.ts`
- Modify: `app/(data-entry)/layout.tsx`
- Create: `app/(data-entry)/payouts/page.tsx`
- Create: `components/payouts/payout-workspace.tsx`
- Create: `src/lib/payouts/schema.ts`
- Create: `src/lib/payouts/schema.test.ts`
- Create: `src/lib/payouts/actions.ts`
- Create: `src/lib/payouts/workspace.ts`
- Create: `src/lib/payouts/workspace-contract.test.ts`

**Interfaces:**

- Consumes: selected month, generated obligations, `DATA_ENTRY` session, and existing shadcn components.
- Produces:
  - `AppSection` value `"payouts"` allowed only for `DATA_ENTRY`
  - `recordFullPayoutSchema`
  - `recordFullPayout(previousState, formData): Promise<PayoutActionState>`
  - `getPayoutWorkspace(periodKey, exceptions): Promise<PayoutWorkspaceData>`
  - responsive `/payouts` UI.

- [ ] **Step 1: Write failing schema and source-contract tests**

```ts
expect(recordFullPayoutSchema.safeParse({
  obligationId: "obligation",
  method: "ONLINE",
  paidAt: "2026-07-17",
  referenceNumber: "TX-1",
}).success).toBe(true);
expect(recordFullPayoutSchema.safeParse({
  obligationId: "",
  method: "ONLINE",
  paidAt: "",
}).success).toBe(false);
```

The workspace source contract must assert:

```ts
expect(page).toContain('requireRole(["DATA_ENTRY"])');
expect(page).toContain("ensureSalaryObligations");
expect(layout).toContain('href: "/payouts"');
expect(actions).toContain('requireRole(["DATA_ENTRY"])');
expect(actions).toContain("PayoutObligationStatus.DUE");
expect(actions).toContain("tx.payout.create");
expect(actions).toContain("tx.auditLog.create");
expect(actions).toContain("ALREADY_PAID");
```

- [ ] **Step 2: Verify RED**

Run `pnpm exec vitest run src/lib/payouts/schema.test.ts src/lib/payouts/workspace-contract.test.ts`.

Expected: FAIL because the workspace and action do not exist.

- [ ] **Step 3: Implement validation**

```ts
export const recordFullPayoutSchema = z.object({
  obligationId: z.string().trim().min(1),
  method: z.enum(["CASH", "ONLINE", "CARD", "OTHER"]),
  paidAt: z.iso.date(),
  referenceNumber: z.string().trim().max(200).optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});
```

- [ ] **Step 4: Implement the full settlement transaction**

Use the authenticated session's user ID. Inside `db.$transaction` reload the obligation, require `DUE`, and create:

```ts
const payout = await tx.payout.create({
  data: {
    obligationId: obligation.id,
    amount: obligation.amount,
    method: data.method,
    referenceNumber: data.referenceNumber || null,
    note: data.note || null,
    paidAt: new Date(`${data.paidAt}T00:00:00+08:00`),
    recordedById: session.user.id,
  },
});
await tx.payoutObligation.update({
  where: { id: obligation.id },
  data: { status: PayoutObligationStatus.PAID },
});
await tx.auditLog.create({
  data: {
    actorId: session.user.id,
    entityType: "PayoutObligation",
    entityId: obligation.id,
    action: "PAYOUT_RECORDED",
    before: { status: "DUE", amount: obligation.amount.toString() },
    after: { status: "PAID", payoutId: payout.id, amount: obligation.amount.toString() },
  },
});
```

Map unique-constraint or non-DUE retries to `ALREADY_PAID`; never accept a client amount.

- [ ] **Step 5: Implement workspace query and aggregates**

Load obligations for the month with team, member, and payout. Accept the setup exceptions returned by `ensureSalaryObligations` and include them unchanged in:

```ts
type PayoutWorkspaceData = {
  periodKey: string;
  summary: { salaryDue: number; salaryPaid: number; commissionDue: number; commissionPaid: number };
  obligations: Array<{
    id: string;
    type: "SALARY" | "COMMISSION";
    status: "DUE" | "PAID" | "VOID";
    teamName: string;
    memberName: string;
    amount: number;
    earnedAt: string;
    invoiceNumber: string | null;
    paidAt: string | null;
  }>;
  exceptions: Array<{ teamId: string; teamName: string; message: string }>;
};
```

- [ ] **Step 6: Build the responsive payout UI**

The page parses `month`, calls `ensureSalaryObligations`, then `getPayoutWorkspace`. The client workspace renders:

- Month input submitting a GET form.
- Four summary cards.
- Type/team/status filters.
- Setup-exception panel.
- Desktop table and mobile cards.
- A full-payout form for each due row with `method`, `paidAt`, `referenceNumber`, and `note`.
- Paid rows with method/date/reference and no mutation action.

Use `FormSelect`, `SelectItem`, `Button`, `Card`, `Badge`, and semantic theme tokens.

- [ ] **Step 7: Add navigation and permission mapping**

Add `"payouts"` to `AppSection`, map it to `["DATA_ENTRY"]`, and add `{ href: "/payouts", label: "Payouts", ... }` to Data Entry desktop/mobile navigation.

- [ ] **Step 8: Verify GREEN**

Run:

```powershell
pnpm exec vitest run src/lib/payouts/schema.test.ts src/lib/payouts/workspace-contract.test.ts
pnpm typecheck
```

Expected: all pass.

- [ ] **Step 9: Commit the payout workspace**

```powershell
git add -- src/lib/auth/permissions.ts app/(data-entry)/layout.tsx app/(data-entry)/payouts/page.tsx components/payouts/payout-workspace.tsx src/lib/payouts/schema.ts src/lib/payouts/schema.test.ts src/lib/payouts/actions.ts src/lib/payouts/workspace.ts src/lib/payouts/workspace-contract.test.ts
git commit -m "feat: add team payout workspace"
```

### Task 7: Add CEO read-only payout aggregates

**Files:**

- Modify: `src/lib/dashboard/monitoring.ts`
- Modify: `components/dashboard/ceo-dashboard.tsx`
- Create: `src/lib/dashboard/payout-summary.test.ts`

**Interfaces:**

- Consumes: current Malaysia month range and payout obligation status/type.
- Produces: `snapshot.payouts` with salary and commission due/paid totals and read-only dashboard cards.

- [ ] **Step 1: Write the failing dashboard contract**

```ts
const monitoring = read("./monitoring.ts");
const dashboard = read("../../../components/dashboard/ceo-dashboard.tsx");

expect(monitoring).toContain("payoutObligation.aggregate");
expect(monitoring).toContain("salaryDue");
expect(monitoring).toContain("salaryPaid");
expect(monitoring).toContain("commissionDue");
expect(monitoring).toContain("commissionPaid");
expect(dashboard).toContain("Salary payouts");
expect(dashboard).toContain("Commission payouts");
expect(dashboard).not.toContain("recordFullPayout");
```

- [ ] **Step 2: Verify RED**

Run `pnpm exec vitest run src/lib/dashboard/payout-summary.test.ts`.

Expected: FAIL because payout aggregates are absent.

- [ ] **Step 3: Query four independent aggregates in parallel**

Extend `MonitoringSnapshot`:

```ts
payouts: {
  salaryDue: number;
  salaryPaid: number;
  commissionDue: number;
  commissionPaid: number;
};
```

Get the current Malaysia `periodKey` and month range from `src/lib/payouts/month.ts`. Add four `db.payoutObligation.aggregate` calls: salary rows filter by `periodKey`; commission rows filter by `earnedAt: { gte: rangeStart, lt: rangeEnd }`. Map Decimal totals through `numeric`. Do not reuse the operational Today/7 days/30 days range for payout totals.

- [ ] **Step 4: Render read-only cards**

Add a `Team payouts — current month` section with:

```tsx
<Metric label="Salary payouts" value={formatMoney(snapshot.payouts.salaryPaid)} detail={`${formatMoney(snapshot.payouts.salaryDue)} still due`} />
<Metric label="Commission payouts" value={formatMoney(snapshot.payouts.commissionPaid)} detail={`${formatMoney(snapshot.payouts.commissionDue)} still due`} />
```

Do not import actions, forms, or editable controls.

- [ ] **Step 5: Verify GREEN**

Run `pnpm exec vitest run src/lib/dashboard/payout-summary.test.ts src/lib/dashboard/command-center.test.ts`.

Expected: PASS.

- [ ] **Step 6: Commit reporting**

```powershell
git add -- src/lib/dashboard/monitoring.ts components/dashboard/ceo-dashboard.tsx src/lib/dashboard/payout-summary.test.ts
git commit -m "feat: report team payouts to CEO"
```

### Task 8: Apply migration and verify the complete workflow

**Files:**

- Verify: all files named above
- Verify: `docs/superpowers/specs/2026-07-17-team-salaries-commission-payouts-design.md`
- Verify: `Plan.md`

**Interfaces:**

- Consumes: completed schema, calculations, generation services, invoice integration, payout UI, and dashboard reporting.
- Produces: current database schema plus automated and browser evidence for every confirmed rule.

- [ ] **Step 1: Apply the migration**

Run `pnpm db:migrate`.

Expected: migration `20260717190000_add_team_payouts` applies successfully. If sandboxed network access fails, rerun only this command with the required approval; never print environment values.

- [ ] **Step 2: Run complete automated verification**

Run these commands fresh:

```powershell
pnpm db:generate
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Expected: every command exits 0 with no test failures, lint errors, type errors, or build errors.

- [ ] **Step 3: Start the local app**

Run `pnpm dev` and use the saved signed-in Data Entry browser session. Do not inspect cookies, local storage, passwords, or secret files.

- [ ] **Step 4: Verify salary generation**

Open `/payouts?month=2026-07`. Confirm each valid salary team has exactly two RM 1,000 due rows and a RM 2,000 team total. Reload and confirm no duplicates appear. Confirm invalid teams, if any, appear in the setup-exception panel.

- [ ] **Step 5: Verify a commission invoice**

Issue a controlled test invoice with RM 560 commissionable sales for the commission team. Confirm one `CommissionEntry` produces RM 336 team, RM 140 sender, RM 84 company, and two RM 168 member obligations. Confirm the obligation exists even if the invoice has no customer payment.

- [ ] **Step 6: Verify full payout and duplicate prevention**

Record one full payout with method and reference. Confirm the row becomes paid and loses its mutation action. Repeat the same submission and confirm the UI reports that it is already paid without creating a second payout.

- [ ] **Step 7: Verify permissions and CEO reporting**

Confirm Data Entry can access `/payouts`. Confirm dispatcher, team lead, viewer, partner viewer, and unauthenticated sessions are redirected or denied. In the CEO session, confirm salary and commission due/paid aggregates appear without payout forms or buttons.

- [ ] **Step 8: Capture visual evidence**

Capture screenshots of the Data Entry payout workspace at desktop and 360-pixel mobile width, plus the CEO read-only payout aggregates. Confirm semantic light/dark styling and no horizontal overflow.

- [ ] **Step 9: Final completion audit**

Run:

```powershell
git status --short
git diff --check
git log --oneline -8
```

Compare the implementation line by line with the approved design specification. Confirm the pre-existing uncommitted dropdown/handoff changes remain preserved and were not accidentally included in payout commits.
