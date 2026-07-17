# CEO Revenue Ranges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic CEO-only billed-revenue and collected-payment totals for the Malaysia calendar day, 7 days, 30 days, and an inclusive custom date range.

**Architecture:** Resolve URL search parameters through a pure Malaysia-time date-range module, then pass that validated range into the existing server-side monitoring query. Render preset links, a native GET custom-range form, and separate billed-versus-collected cards in the existing read-only CEO dashboard.

**Tech Stack:** Next.js 16 App Router, React 19 server components, TypeScript, Prisma, Tailwind CSS, shadcn UI, Vitest

## Global Constraints

- Keep all work on the current branch.
- Use `Asia/Kuala_Lumpur` (`UTC+08:00`) for calendar boundaries.
- Treat `24h` as Malaysia midnight through now, not a rolling window.
- Sum non-void invoices by `issuedAt` for billed revenue.
- Sum payments by `receivedAt` for payments collected.
- Keep the CEO/Admin dashboard read-only and server-authorized.
- Do not add a database migration or client-side money calculation.

---

### Task 1: Pure Malaysia-Time Revenue Range Resolver

**Files:**
- Create: `src/lib/dashboard/revenue-range.ts`
- Create: `src/lib/dashboard/revenue-range.test.ts`

**Interfaces:**
- Produces:
  - `RevenuePeriod = "24h" | "7d" | "30d" | "custom"`
  - `RevenueRangeInput = { period?: string; from?: string; to?: string }`
  - `RevenueRange = { period: RevenuePeriod; from: string; to: string; rangeStart: Date; rangeEnd: Date; label: string }`
  - `resolveRevenueRange(input: RevenueRangeInput, now?: Date): RevenueRange`
- Consumers: `app/(ceo)/page.tsx`, `src/lib/dashboard/monitoring.ts`, and `components/dashboard/ceo-dashboard.tsx`

- [ ] **Step 1: Write failing unit tests for preset ranges**

Create tests using `now = new Date("2026-07-17T07:30:00.000Z")`, which is
`15:30` in Malaysia. Assert:

```ts
expect(resolveRevenueRange({ period: "24h" }, now)).toMatchObject({
  period: "24h",
  from: "2026-07-17",
  to: "2026-07-17",
  rangeStart: new Date("2026-07-16T16:00:00.000Z"),
  rangeEnd: now,
});

expect(resolveRevenueRange({ period: "7d" }, now)).toMatchObject({
  from: "2026-07-11",
  to: "2026-07-17",
  rangeStart: new Date("2026-07-10T16:00:00.000Z"),
  rangeEnd: now,
});

expect(resolveRevenueRange({ period: "30d" }, now)).toMatchObject({
  from: "2026-06-18",
  to: "2026-07-17",
  rangeStart: new Date("2026-06-17T16:00:00.000Z"),
  rangeEnd: now,
});
```

- [ ] **Step 2: Run the preset tests and verify RED**

Run:

```powershell
pnpm exec vitest run src/lib/dashboard/revenue-range.test.ts
```

Expected: FAIL because `revenue-range.ts` and `resolveRevenueRange` do not
exist.

- [ ] **Step 3: Implement the minimal preset resolver**

Implement helpers that:

```ts
const BUSINESS_TIME_ZONE = "Asia/Kuala_Lumpur";
const MALAYSIA_OFFSET = "+08:00";

function malaysiaDateKey(date: Date): string;
function addCalendarDays(value: string, days: number): string;
function malaysiaMidnight(value: string): Date;
function formatRangeLabel(from: string, to: string): string;
```

Use `Intl.DateTimeFormat(...).formatToParts()` for the Malaysia date key,
Gregorian UTC date arithmetic for date-key addition, and
`${value}T00:00:00+08:00` for database boundaries. Return `now` as the
exclusive preset `rangeEnd`.

- [ ] **Step 4: Run the preset tests and verify GREEN**

Run:

```powershell
pnpm exec vitest run src/lib/dashboard/revenue-range.test.ts
```

Expected: all preset tests PASS.

- [ ] **Step 5: Write failing tests for custom and invalid ranges**

Add assertions that:

```ts
expect(resolveRevenueRange(
  { period: "custom", from: "2026-07-01", to: "2026-07-17" },
  now,
)).toMatchObject({
  period: "custom",
  from: "2026-07-01",
  to: "2026-07-17",
  rangeStart: new Date("2026-06-30T16:00:00.000Z"),
  rangeEnd: new Date("2026-07-17T16:00:00.000Z"),
});
```

Unknown periods, missing custom dates, `2026-02-30`, and a `from` date after
`to` must each resolve to the same `24h` result.

- [ ] **Step 6: Run the custom tests and verify RED**

Run:

```powershell
pnpm exec vitest run src/lib/dashboard/revenue-range.test.ts
```

Expected: FAIL because custom parsing and strict calendar validation are
missing.

- [ ] **Step 7: Implement custom validation and inclusive boundaries**

Validate `YYYY-MM-DD` with a regular expression, reconstruct the date in
Malaysia time, and compare its Malaysia date key to reject normalized
impossible dates. For a valid custom range, set `rangeEnd` to Malaysia
midnight after `to`. For every invalid selection, call the internal `24h`
resolver.

- [ ] **Step 8: Run the range tests and verify GREEN**

Run:

```powershell
pnpm exec vitest run src/lib/dashboard/revenue-range.test.ts
```

Expected: all range tests PASS.

- [ ] **Step 9: Commit the range resolver**

```powershell
git add -- src/lib/dashboard/revenue-range.ts src/lib/dashboard/revenue-range.test.ts
git commit -m "feat: add CEO revenue date ranges"
```

---

### Task 2: Server-Side Revenue Aggregation

**Files:**
- Modify: `src/lib/dashboard/monitoring.ts`
- Create: `src/lib/dashboard/revenue-summary.test.ts`

**Interfaces:**
- Consumes: `RevenueRange` from Task 1.
- Produces:
  - `getMonitoringSnapshot(range: RevenueRange): Promise<MonitoringSnapshot>`
  - `MonitoringSnapshot.selection: Pick<RevenueRange, "period" | "from" | "to">`
  - `MonitoringSnapshot.finance.billedRevenue: number`
  - `MonitoringSnapshot.finance.paymentsCollected: number`

- [ ] **Step 1: Write a failing aggregation regression test**

Read `monitoring.ts` as source and assert it contains:

```ts
expect(monitoring).toContain("getMonitoringSnapshot(range: RevenueRange)");
expect(monitoring).toContain("issuedAt: inRange");
expect(monitoring).toContain('status: { not: "VOID" }');
expect(monitoring).toContain("receivedAt: inRange");
expect(monitoring).toContain("billedRevenue:");
expect(monitoring).toContain("paymentsCollected:");
expect(monitoring).toContain("lt: range.rangeEnd");
```

- [ ] **Step 2: Run the regression test and verify RED**

Run:

```powershell
pnpm exec vitest run src/lib/dashboard/revenue-summary.test.ts
```

Expected: FAIL because the snapshot still accepts the old period and uses the
old finance names.

- [ ] **Step 3: Refactor monitoring to consume the validated range**

Import `RevenueRange`, remove the local period parser and range builder, and
build:

```ts
const inRange = { gte: range.rangeStart, lt: range.rangeEnd };
```

Keep the independent aggregates in the existing `Promise.all`. Map invoice
totals to `finance.billedRevenue` and payment totals to
`finance.paymentsCollected`. Preserve `received` as an alias only if an
unchanged existing consumer still requires it; otherwise remove it. Copy
`period`, `from`, and `to` into `snapshot.selection`, and use `range.label` as
the snapshot label.

- [ ] **Step 4: Run dashboard finance tests and verify GREEN**

Run:

```powershell
pnpm exec vitest run src/lib/dashboard/revenue-summary.test.ts src/lib/dashboard/company-expenses.test.ts src/lib/dashboard/payout-summary.test.ts
```

Expected: all selected tests PASS.

- [ ] **Step 5: Commit server aggregation**

```powershell
git add -- src/lib/dashboard/monitoring.ts src/lib/dashboard/revenue-summary.test.ts
git commit -m "feat: aggregate CEO revenue by range"
```

---

### Task 3: CEO Route and Responsive Revenue Controls

**Files:**
- Modify: `app/(ceo)/page.tsx`
- Modify: `components/dashboard/ceo-dashboard.tsx`
- Create: `components/dashboard/ceo-revenue-controls.test.ts`

**Interfaces:**
- Consumes: `resolveRevenueRange`, `RevenuePeriod`, and the extended
  `MonitoringSnapshot`.
- Produces: URL-driven preset controls, a native custom GET form, and
  read-only revenue cards.

- [ ] **Step 1: Write a failing route and UI regression test**

Read the CEO page and dashboard source and assert:

```ts
expect(page).toContain("resolveRevenueRange");
expect(page).toContain("params.from");
expect(page).toContain("params.to");
expect(dashboard).toContain("Billed revenue");
expect(dashboard).toContain("Payments collected");
expect(dashboard).toContain('value="custom"');
expect(dashboard).toContain('name="from"');
expect(dashboard).toContain('name="to"');
expect(dashboard).toContain("Apply range");
expect(page).toContain('requireRole(["ADMIN"])');
expect(dashboard).not.toContain("createRevenue");
```

- [ ] **Step 2: Run the UI regression test and verify RED**

Run:

```powershell
pnpm exec vitest run components/dashboard/ceo-revenue-controls.test.ts
```

Expected: FAIL because the route and controls do not yet support custom
ranges or dedicated revenue cards.

- [ ] **Step 3: Pass validated search parameters through the CEO route**

Extend the page search parameter type to:

```ts
Promise<{ period?: string; from?: string; to?: string }>
```

Resolve the range before calling `getMonitoringSnapshot`:

```ts
const range = resolveRevenueRange({
  period: params.period,
  from: params.from,
  to: params.to,
});
const snapshot = await getMonitoringSnapshot(range);
```

Keep `requireRole(["ADMIN"])` in the same server component.

- [ ] **Step 4: Implement the period controls and revenue section**

Replace the old period loop with preset links for `24h`, `7d`, and `30d`.
Add a `<details>` custom control whose `<summary>` reads `Custom`; keep it
open for an active custom selection. Inside it, use:

```tsx
<form action="/" method="get">
  <input type="hidden" name="period" value="custom" />
  <input type="date" name="from" defaultValue={snapshot.selection.from} required />
  <input type="date" name="to" defaultValue={snapshot.selection.to} required />
  <button type="submit">Apply range</button>
</form>
```

Add a `Revenue` section immediately after the controls with two `Metric`
cards for `snapshot.finance.billedRevenue` and
`snapshot.finance.paymentsCollected`. In the operational metrics, relabel the
existing payment card as `Cash collected by teams` so the two headline
revenue figures are not duplicated.

Keep `grid-cols-[minmax(0,1fr)]`, stack the custom form below 640px, and use
existing theme tokens and control styles.

- [ ] **Step 5: Run the UI and dashboard tests and verify GREEN**

Run:

```powershell
pnpm exec vitest run components/dashboard/ceo-revenue-controls.test.ts src/lib/dashboard/revenue-summary.test.ts src/lib/dashboard/company-expenses.test.ts
```

Expected: all selected tests PASS.

- [ ] **Step 6: Apply React performance review**

Confirm:

- the CEO page remains a server component;
- aggregation remains parallel rather than sequential;
- no client component or client-side financial dataset is introduced;
- static formatters remain module-scoped; and
- only primitive selection values cross component boundaries.

- [ ] **Step 7: Commit the CEO interface**

```powershell
git add -- app/(ceo)/page.tsx components/dashboard/ceo-dashboard.tsx components/dashboard/ceo-revenue-controls.test.ts
git commit -m "feat: add CEO revenue range controls"
```

---

### Task 4: Full Verification and Signed-In Browser QA

**Files:**
- Modify only if verification exposes an in-scope defect.
- Create screenshots under the Codex visualization directory.

**Interfaces:**
- Consumes the completed CEO revenue reporting flow.
- Produces automated evidence, responsive runtime evidence, and final
  screenshots.

- [ ] **Step 1: Run focused revenue tests**

```powershell
pnpm exec vitest run src/lib/dashboard/revenue-range.test.ts src/lib/dashboard/revenue-summary.test.ts components/dashboard/ceo-revenue-controls.test.ts
```

Expected: all focused tests PASS.

- [ ] **Step 2: Run the full automated verification**

```powershell
pnpm test
pnpm lint
pnpm typecheck
```

Expected: all commands exit `0` with no test, lint, or type failures.

- [ ] **Step 3: Verify all preset selections while signed in**

Using the existing in-app browser session and supplied CEO credentials:

- open `/?period=24h`;
- verify `Billed revenue` and `Payments collected` are visible;
- open `/?period=7d`;
- open `/?period=30d`; and
- verify each preset stays selected and changes the resolved header label.

- [ ] **Step 4: Verify a custom inclusive range**

Open Custom, enter `2026-07-01` through `2026-07-17`, apply it, and verify:

```text
/?period=custom&from=2026-07-01&to=2026-07-17
```

Confirm both dates remain populated after navigation and both revenue totals
render. Confirm no create, edit, save-revenue, or ledger control appears.

- [ ] **Step 5: Verify responsive containment**

At desktop width `1440x900` and mobile width `360x800`, record:

```js
({
  clientWidth: document.documentElement.clientWidth,
  scrollWidth: document.documentElement.scrollWidth,
})
```

Expected: `clientWidth === scrollWidth` at both widths. Confirm the custom
form and revenue cards remain usable at mobile width.

- [ ] **Step 6: Capture and show the signed-in interface**

Save final desktop and mobile screenshots with descriptive filenames in the
thread visualization directory, restore the browser viewport, and leave the
verified custom or 30-day CEO dashboard open.

- [ ] **Step 7: Inspect final repository state**

```powershell
git diff --check
git status --short
git log -6 --oneline
```

Expected: no whitespace errors, a clean worktree, and the design, plan, and
implementation commits visible on the current branch.
