# CEO Company Expenses Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show selected-period company-expense totals and recent records on the existing read-only CEO dashboard.

**Architecture:** Extend `MonitoringSnapshot` and `getMonitoringSnapshot` with one company-expense aggregate and one recent-record query, then render that typed data inside `CeoDashboard`. Keep company-expense creation in the existing Data Entry ledger and do not change the company-profit calculation.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Prisma, Vitest

## Global Constraints

- Stay on the current branch.
- Keep the CEO dashboard-only and read-only.
- Show the selected-period total and at most eight recent company-expense rows.
- Query by the expense business `date`, ordered by `date` then `createdAt`, descending.
- Display date, category, payment method, and amount.
- Do not expose ledger mutation actions or links.
- Do not change the existing `companyProfit` calculation.
- Keep personal expenses, team expenses, and petty cash outside this section.

---

### Task 1: Add company expenses to the CEO monitoring path

**Files:**
- Create: `src/lib/dashboard/company-expenses.test.ts`
- Modify: `src/lib/dashboard/monitoring.ts`
- Modify: `components/dashboard/ceo-dashboard.tsx`

**Interfaces:**
- Consumes: `CompanyExpense` Prisma records inside `getMonitoringSnapshot`
- Produces: `MonitoringSnapshot.companyExpenses` with `total: number` and `recent: MonitoringCompanyExpense[]`

- [ ] **Step 1: Write the failing regression test**

Create `src/lib/dashboard/company-expenses.test.ts`:

```ts
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const monitoring = readFileSync(new URL("./monitoring.ts", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../../../components/dashboard/ceo-dashboard.tsx", import.meta.url), "utf8");

describe("CEO company expense visibility", () => {
  it("loads the selected-period total and recent company expenses", () => {
    expect(monitoring).toContain("companyExpense.aggregate");
    expect(monitoring).toContain("companyExpense.findMany");
    expect(monitoring).toContain("companyExpenses:");
    expect(monitoring).toContain("MonitoringCompanyExpense");
    expect(monitoring).toContain("date: inRange");
    expect(monitoring).toContain('take: 8');
  });

  it("renders company expenses without exposing ledger mutations", () => {
    expect(dashboard).toContain('title="Company expenses"');
    expect(dashboard).toContain("Company expense total");
    expect(dashboard).toContain("Payment method");
    expect(dashboard).toContain("No company expenses recorded");
    expect(dashboard).not.toContain("createCompanyExpense");
  });
});
```

- [ ] **Step 2: Run the regression test and verify RED**

Run:

```bash
pnpm test src/lib/dashboard/company-expenses.test.ts
```

Expected: both tests fail because the loader and CEO dashboard currently contain no company-expense monitoring path.

- [ ] **Step 3: Add the typed monitoring data**

In `src/lib/dashboard/monitoring.ts`, add:

```ts
export type MonitoringCompanyExpense = {
  id: string;
  date: string;
  category: string;
  amount: number;
  paymentMethod: string | null;
};
```

Add this field to `MonitoringSnapshot`:

```ts
companyExpenses: {
  total: number;
  recent: MonitoringCompanyExpense[];
};
```

Add `companyExpenseTotals` and `recentCompanyExpenses` to the `Promise.all` destructuring and add these queries:

```ts
db.companyExpense.aggregate({
  where: { date: inRange },
  _sum: { amount: true },
}),
db.companyExpense.findMany({
  where: { date: inRange },
  select: {
    id: true,
    date: true,
    category: true,
    amount: true,
    paymentMethod: true,
  },
  orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  take: 8,
}),
```

Map the results into the snapshot:

```ts
companyExpenses: {
  total: numeric(companyExpenseTotals._sum.amount),
  recent: recentCompanyExpenses.map((expense) => ({
    id: expense.id,
    date: expense.date.toISOString().slice(0, 10),
    category: expense.category,
    amount: numeric(expense.amount),
    paymentMethod: expense.paymentMethod,
  })),
},
```

- [ ] **Step 4: Render the read-only CEO section**

In `components/dashboard/ceo-dashboard.tsx`, import `LandmarkIcon` and render the section after the operational overview:

```tsx
<section data-motion="item">
  <SectionHeading
    title="Company expenses"
    description={`Operating costs recorded in ${snapshot.label.toLowerCase()}.`}
  />
  <div className="grid gap-3 xl:grid-cols-[minmax(240px,0.35fr)_minmax(0,1fr)]">
    <Metric
      icon={LandmarkIcon}
      label="Company expense total"
      value={formatMoney(snapshot.companyExpenses.total)}
      detail={`${snapshot.companyExpenses.recent.length} recent records shown`}
    />
    {snapshot.companyExpenses.recent.length > 0 ? (
      <div className="overflow-x-auto rounded-lg border border-[#d8e0dc] bg-background dark:border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Payment method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshot.companyExpenses.recent.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-mono text-xs">{expense.date}</TableCell>
                <TableCell className="font-medium">{expense.category}</TableCell>
                <TableCell>{expense.paymentMethod ? formatStatus(expense.paymentMethod) : "Not recorded"}</TableCell>
                <TableCell className="text-right font-medium">{formatMoney(expense.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    ) : (
      <EmptyState
        icon={LandmarkIcon}
        title="No company expenses recorded"
        description={`Company expenses dated within ${snapshot.label.toLowerCase()} will appear here.`}
      />
    )}
  </div>
</section>
```

Do not import `createCompanyExpense`, link to `/ledger`, or alter the company-profit metric.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
pnpm test src/lib/dashboard/company-expenses.test.ts src/lib/dashboard/payout-summary.test.ts
```

Expected: both selected test files pass.

- [ ] **Step 6: Run project verification**

Run:

```bash
pnpm test
pnpm lint
pnpm typecheck
```

Expected: all commands exit with code 0.

- [ ] **Step 7: Verify the signed-in CEO interface**

Open the existing signed-in CEO dashboard session and confirm:

- The selected-period company-expense total is visible.
- Recent matching rows show date, category, payment method, and amount, or the empty state is visible.
- No create/edit/delete control or Data Entry ledger navigation is exposed.
- The section has no horizontal page overflow at 1440 and 360 pixels.

Save desktop and mobile screenshots under:

```text
C:/Users/Raffey/.codex/visualizations/2026/07/17/019f702c-c85f-78e2-bd5b-afb45097e6dd/
```

- [ ] **Step 8: Commit**

```bash
git add src/lib/dashboard/company-expenses.test.ts src/lib/dashboard/monitoring.ts components/dashboard/ceo-dashboard.tsx
git commit -m "fix: show company expenses to CEO"
```

