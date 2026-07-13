# Unified Data-Entry Job Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the separate Intake, Dispatch, Jobs, Team updates, and Invoices operator destinations with one server-driven `/jobs` workspace that advances each job through WhatsApp intake, assignment, manual team report, invoice, and customer handoff.

**Architecture:** Keep `/jobs` as a React Server Component that loads a narrow action queue and the selected job in parallel. Add pure stage/queue functions plus authenticated orchestration actions, then compose focused client forms inside a responsive job-flow shell. Reuse existing Prisma models, deterministic billing functions, public invoice/feedback routes, and shadcn theme tokens.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma/PostgreSQL, Zod, shadcn/Tailwind CSS, Vitest.

## Global Constraints

- Preserve unrelated user changes and stay on the current branch.
- Keep all money, permission, stage-transition, and invoice validation on the server.
- Keep customer WhatsApp parsing AI-assisted and human-reviewed; never AI-parse team completion messages.
- Preserve both raw customer and raw team WhatsApp text for audit.
- Do not hard-code team names, sender names, or commission rates in UI components.
- Reuse semantic shadcn theme tokens in both light and dark mode; do not add light-only surfaces.
- Do not add a Prisma migration unless current persisted records prove insufficient.
- Keep `/invoice/[token]`, `/api/invoice/[token]/pdf`, and `/feedback/[token]` public and tokenized.
- Run financial tests before wiring calculated totals into the unified interface.

## File Map

- Create `src/lib/job-flow/stage.ts`: pure persisted-stage resolution.
- Create `src/lib/job-flow/stage.test.ts`: stage and terminal-state tests.
- Create `src/lib/job-flow/queue.ts`: queue grouping, priority, and labels.
- Create `src/lib/job-flow/queue.test.ts`: queue ordering tests.
- Create `src/lib/job-flow/schema.ts`: manual team report and invoice-with-payment validation.
- Create `src/lib/job-flow/schema.test.ts`: payment/closeout validation tests.
- Create `src/lib/job-flow/actions.ts`: authenticated report-closeout orchestration.
- Modify `src/lib/intake/actions.ts`: continue a saved intake to the selected job.
- Modify `src/lib/operations/actions.ts`: expose assignment success to the unified flow.
- Modify `src/lib/billing/actions.ts`: atomically issue invoice plus initial payment rows.
- Modify `src/lib/billing/schema.ts`: shared payment-line schema.
- Create `components/job-flow/job-flow-shell.tsx`: responsive desktop/mobile composition.
- Create `components/job-flow/job-action-queue.tsx`: grouped job queue.
- Create `components/job-flow/job-stage-rail.tsx`: five persisted stages.
- Create `components/job-flow/job-summary.tsx`: stable customer/job context.
- Create `components/job-flow/stages/intake-stage.tsx`: embedded intake wrapper.
- Create `components/job-flow/stages/assign-stage.tsx`: selected-job assignment form.
- Create `components/job-flow/stages/report-stage.tsx`: raw team message plus closeout/payment form.
- Create `components/job-flow/stages/invoice-stage.tsx`: invoice and initial payment editor.
- Create `components/job-flow/stages/handoff-stage.tsx`: PDF, print, invoice, and feedback actions.
- Modify `components/intake/intake-workspace.tsx`: support embedded continuation and manual fallback.
- Replace `app/(data-entry)/jobs/page.tsx`: unified server data loader and route state.
- Modify `app/(data-entry)/layout.tsx`: one core `Job flow` navigation item.
- Modify `src/lib/auth/permissions.ts`: default Data Entry and Dispatcher routes point to `/jobs`.
- Replace `app/(data-entry)/jobs/intake/page.tsx`, `app/(data-entry)/dispatch/page.tsx`, `app/(data-entry)/team-entries/page.tsx`, and `app/(data-entry)/invoices/page.tsx`: compatibility redirects.
- Replace `app/(data-entry)/invoices/[id]/page.tsx`: redirect internal invoice detail to its job handoff.
- Modify `app/globals.css`: semantic action/audit status tokens for light and dark themes.

---

### Task 1: Persisted Stage Resolution and Queue Priority

**Files:**
- Create: `src/lib/job-flow/stage.test.ts`
- Create: `src/lib/job-flow/stage.ts`
- Create: `src/lib/job-flow/queue.test.ts`
- Create: `src/lib/job-flow/queue.ts`

**Interfaces:**
- Produces: `resolveJobFlowStage(job: JobFlowState | null): JobFlowStage`
- Produces: `getJobQueueGroup(job: JobFlowState): JobQueueGroup`
- Produces: `compareJobQueueItems(a: JobQueueItem, b: JobQueueItem): number`

- [ ] **Step 1: Write the failing stage tests**

```ts
import { describe, expect, it } from "vitest";
import { resolveJobFlowStage } from "./stage";

describe("resolveJobFlowStage", () => {
  it("uses WhatsApp for a new unsaved flow", () => expect(resolveJobFlowStage(null)).toBe("WHATSAPP"));
  it("uses assignment until an active team is recorded", () => expect(resolveJobFlowStage({ status: "BOOKED", assignedTeamId: null, performed: null, invoiceId: null })).toBe("ASSIGNMENT"));
  it("keeps assigned and postponed jobs in team report", () => {
    expect(resolveJobFlowStage({ status: "ASSIGNED", assignedTeamId: "team_1", performed: null, invoiceId: null })).toBe("TEAM_REPORT");
    expect(resolveJobFlowStage({ status: "POSTPONED", assignedTeamId: "team_1", performed: false, invoiceId: null })).toBe("TEAM_REPORT");
  });
  it("advances completed uninvoiced jobs to invoice", () => expect(resolveJobFlowStage({ status: "COMPLETED", assignedTeamId: "team_1", performed: true, invoiceId: null })).toBe("INVOICE"));
  it("uses customer handoff once an invoice exists", () => expect(resolveJobFlowStage({ status: "COMPLETED", assignedTeamId: "team_1", performed: true, invoiceId: "invoice_1" })).toBe("CUSTOMER_HANDOFF"));
  it("marks cancelled jobs terminal at team report", () => expect(resolveJobFlowStage({ status: "CANCELLED", assignedTeamId: "team_1", performed: false, invoiceId: null })).toBe("TEAM_REPORT"));
});
```

- [ ] **Step 2: Run the stage tests and verify RED**

Run: `pnpm test src/lib/job-flow/stage.test.ts`

Expected: FAIL because `src/lib/job-flow/stage.ts` does not exist.

- [ ] **Step 3: Implement the minimal stage resolver**

```ts
import type { JobStatus } from "@/src/generated/prisma/enums";

export type JobFlowStage = "WHATSAPP" | "ASSIGNMENT" | "TEAM_REPORT" | "INVOICE" | "CUSTOMER_HANDOFF";
export type JobFlowState = { status: JobStatus; assignedTeamId: string | null; performed: boolean | null; invoiceId: string | null };

export function resolveJobFlowStage(job: JobFlowState | null): JobFlowStage {
  if (!job) return "WHATSAPP";
  if (job.invoiceId) return "CUSTOMER_HANDOFF";
  if (job.status === "COMPLETED" && job.performed) return "INVOICE";
  if (!job.assignedTeamId && job.status !== "CANCELLED") return "ASSIGNMENT";
  return "TEAM_REPORT";
}
```

- [ ] **Step 4: Add queue tests, verify RED, then implement grouping and priority**

```ts
import { describe, expect, it } from "vitest";
import { compareJobQueueItems, getJobQueueGroup } from "./queue";

describe("job-flow queue", () => {
  it("groups persisted stages into operator actions", () => {
    expect(getJobQueueGroup({ status: "BOOKED", assignedTeamId: null, performed: null, invoiceId: null })).toBe("ASSIGN_TEAM");
    expect(getJobQueueGroup({ status: "ASSIGNED", assignedTeamId: "team_1", performed: null, invoiceId: null })).toBe("TEAM_REPORT");
    expect(getJobQueueGroup({ status: "COMPLETED", assignedTeamId: "team_1", performed: true, invoiceId: null })).toBe("CREATE_INVOICE");
    expect(getJobQueueGroup({ status: "COMPLETED", assignedTeamId: "team_1", performed: true, invoiceId: "invoice_1" })).toBe("CUSTOMER_HANDOFF");
  });
  it("sorts invoice and assignment actions before waiting work", () => {
    const rows = [
      { group: "TEAM_REPORT" as const, requestedAt: null, createdAt: "2026-07-13T10:00:00.000Z" },
      { group: "ASSIGN_TEAM" as const, requestedAt: null, createdAt: "2026-07-13T11:00:00.000Z" },
      { group: "CREATE_INVOICE" as const, requestedAt: null, createdAt: "2026-07-13T09:00:00.000Z" },
    ];
    expect(rows.sort(compareJobQueueItems).map((row) => row.group)).toEqual(["CREATE_INVOICE", "ASSIGN_TEAM", "TEAM_REPORT"]);
  });
});
```

Use priority `CREATE_INVOICE = 0`, `ASSIGN_TEAM = 1`, `TEAM_REPORT = 2`, `CUSTOMER_HANDOFF = 3`, `CANCELLED = 4`. Within a group, compare `requestedAt ?? createdAt` ascending.

- [ ] **Step 5: Run the focused tests and all existing tests**

Run: `pnpm test src/lib/job-flow/stage.test.ts src/lib/job-flow/queue.test.ts`

Expected: PASS.

Run: `pnpm test`

Expected: all existing and new tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/job-flow/stage.ts src/lib/job-flow/stage.test.ts src/lib/job-flow/queue.ts src/lib/job-flow/queue.test.ts
git commit -m "feat: add persisted job-flow stages"
```

### Task 2: Manual Team Report and Closeout Transaction

**Files:**
- Create: `src/lib/job-flow/schema.test.ts`
- Create: `src/lib/job-flow/schema.ts`
- Create: `src/lib/job-flow/actions.ts`
- Modify: `src/lib/operations/actions.ts`

**Interfaces:**
- Produces: `teamReportCloseoutSchema`
- Produces: `saveTeamReportAndCloseout(previousState, formData): Promise<JobFlowActionState>`
- Produces: `JobFlowActionState = { error?: string; success?: string; jobId?: string }`

- [ ] **Step 1: Write failing validation tests**

Test a valid completed cash report, a valid split payment report, and rejection of: missing raw WhatsApp text, completed work without amount, paid outcome without payments, payments exceeding amount, cancelled status without cancelled payment outcome, and completed status with `performed = NO`.

The valid split input is:

```ts
const valid = {
  jobId: "job_1",
  expectedUpdatedAt: "2026-07-13T10:00:00.000Z",
  rawWhatsAppText: "Completed service. Customer paid RM 100 cash and RM 80 online.",
  submittedByMemberId: "",
  entryDate: "2026-07-13",
  performed: "YES",
  status: "COMPLETED",
  paymentStatus: "PAID",
  completedAmount: 180,
  payments: [
    { method: "CASH", amount: 100, collectedByTeam: true, referenceNumber: "", notes: "" },
    { method: "ONLINE", amount: 80, collectedByTeam: false, referenceNumber: "TX-1", notes: "" },
  ],
  note: "Cooling confirmed.",
};
```

- [ ] **Step 2: Run the schema test and verify RED**

Run: `pnpm test src/lib/job-flow/schema.test.ts`

Expected: FAIL because the schema does not exist.

- [ ] **Step 3: Implement `teamReportCloseoutSchema`**

Reuse a shared exported `paymentLineSchema` from `src/lib/billing/schema.ts`. Use `superRefine` to enforce the status/payment combinations and compare payment sum against `completedAmount` with cent precision. `PAID` requires equality, `PARTIALLY_PAID` requires a positive sum below the completed amount, `UNPAID` and `NO_CHARGE` require no payment rows, and `NO_CHARGE` requires amount zero.

- [ ] **Step 4: Run the schema test and verify GREEN**

Run: `pnpm test src/lib/job-flow/schema.test.ts`

Expected: PASS.

- [ ] **Step 5: Implement the authenticated orchestration action**

`saveTeamReportAndCloseout` must:

1. Require `DATA_ENTRY`.
2. Parse JSON payment rows before passing input to the schema, including the selected job's `expectedUpdatedAt` value.
3. Load the job with `assignedTeamId`, `status`, and `updatedAt`.
4. Reject missing, cancelled, completed, unassigned, or stale jobs.
5. Validate an optional team member against the assigned team.
6. In one Prisma transaction create an `APPROVED` `COMPLETION` `TeamSubmittedEntry` containing `{ source: "MANUAL_DATA_ENTRY", completedAmount, paymentStatus, payments, performed, status }` in `parsedFields`.
7. Update the job closeout fields and create `JobStatusHistory` with the operator as actor.
8. Revalidate `/jobs` and return the job ID.

Do not create `Payment` rows here; those remain invoice-owned records.

- [ ] **Step 6: Update the existing assignment action result**

Add `jobId?: string` to `OperationActionState` and return the assigned job ID after success. This lets the unified assignment stage refresh the same selected job without duplicating assignment logic.

- [ ] **Step 7: Run focused and full tests**

Run: `pnpm test src/lib/job-flow/schema.test.ts src/lib/operations/schemas.test.ts src/lib/team-entries/schema.test.ts`

Expected: PASS.

Run: `pnpm typecheck`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/job-flow/schema.ts src/lib/job-flow/schema.test.ts src/lib/job-flow/actions.ts src/lib/billing/schema.ts src/lib/operations/actions.ts
git commit -m "feat: unify team report and job closeout"
```

### Task 3: Atomic Invoice and Initial Payments

**Files:**
- Modify: `src/lib/billing/schema.ts`
- Modify: `src/lib/billing/actions.ts`
- Modify: `src/lib/billing/calculations.test.ts`

**Interfaces:**
- Produces: `createInvoiceWithPaymentsSchema`
- Produces: `createInvoiceWithPayments(previousState, formData): Promise<BillingActionState>`

- [ ] **Step 1: Write failing schema and calculation tests**

Add tests proving that initial payment rows may equal but not exceed the calculated invoice total, split payment sums are supported, unpaid invoices accept no initial rows, and zero-total invoices accept no fabricated payments.

- [ ] **Step 2: Run the billing tests and verify RED**

Run: `pnpm test src/lib/billing/calculations.test.ts src/lib/job-flow/schema.test.ts`

Expected: FAIL on the new invoice-with-payments expectations.

- [ ] **Step 3: Extract one internal invoice persistence function**

Inside `src/lib/billing/actions.ts`, add an unexported `persistInvoice(data, payments)` used by both `createInvoice` and the new `createInvoiceWithPayments`. It must keep invoice number retry handling, duplicate-job protection, printable and feedback tokens, invoice items, and job linkage.

When initial payments are supplied, create them in the same transaction and compute `Invoice.status` and `Job.paymentStatus` from the deterministic payment summary. When no payments exist, preserve `UNPAID`; when the total is zero, set `NO_CHARGE` rather than `PAID`.

- [ ] **Step 4: Add the flow action parser**

`createInvoiceWithPayments` parses both `items` and `payments` JSON, validates them together, calls `persistInvoice`, revalidates `/jobs`, and returns both `invoiceId` and `jobId` in `BillingActionState`.

- [ ] **Step 5: Run billing and finance tests**

Run: `pnpm test src/lib/billing/calculations.test.ts src/lib/finance/calculations.test.ts src/lib/job-flow/schema.test.ts`

Expected: PASS, including workbook examples `560 -> 336/140/84` and `510, 115 -> 267.50`.

Run: `pnpm typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/billing/schema.ts src/lib/billing/actions.ts src/lib/billing/calculations.test.ts src/lib/job-flow/schema.test.ts
git commit -m "feat: issue invoices with initial payments"
```

### Task 4: Unified Server Route, Navigation, and Compatibility

**Files:**
- Modify: `app/(data-entry)/layout.tsx`
- Modify: `src/lib/auth/permissions.ts`
- Modify: `src/lib/auth/permissions.test.ts`
- Replace: `app/(data-entry)/jobs/intake/page.tsx`
- Replace: `app/(data-entry)/dispatch/page.tsx`
- Replace: `app/(data-entry)/team-entries/page.tsx`
- Replace: `app/(data-entry)/invoices/page.tsx`
- Replace: `app/(data-entry)/invoices/[id]/page.tsx`
- Create: `src/lib/job-flow/routes.test.ts`

**Interfaces:**
- `/jobs?mode=new`
- `/jobs?job=<job-id>`
- `/jobs?view=assignment|team-report|invoice`

- [ ] **Step 1: Write failing permission and route-contract tests**

Assert `getDefaultRouteForRole("DATA_ENTRY")` and `getDefaultRouteForRole("DISPATCHER")` both return `/jobs`. Source-contract tests assert the data-entry layout contains one `Job flow` core link and no separate `Intake`, `Dispatch`, `Team updates`, or `Invoices` links. Assert compatibility route sources call `redirect()` with the mapped `/jobs` URLs.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `pnpm test src/lib/auth/permissions.test.ts src/lib/job-flow/routes.test.ts`

Expected: FAIL on old default routes and navigation.

- [ ] **Step 3: Consolidate navigation and role defaults**

Replace the core data-entry links with `{ href: "/jobs", label: "Job flow" }`; keep Expenses and Teams. Point Data Entry and Dispatcher default routes to `/jobs`.

- [ ] **Step 4: Add compatibility redirects**

Use server `redirect()` pages:

```ts
export default function LegacyIntakePage() { redirect("/jobs?mode=new"); }
export default function LegacyDispatchPage() { redirect("/jobs?view=assignment"); }
export default function LegacyTeamEntriesPage() { redirect("/jobs?view=team-report"); }
export default function LegacyInvoicesPage() { redirect("/jobs?view=invoice"); }
```

The invoice detail route loads only `{ jobId: true }` by invoice ID and redirects to `/jobs?job=<encoded-job-id>`; missing invoices call `notFound()`.

- [ ] **Step 5: Update intake continuation**

Change `saveReviewedIntake` success redirect from `/jobs?created=<id>` to `/jobs?job=<id>`.

- [ ] **Step 6: Run tests and typecheck**

Run: `pnpm test src/lib/auth/permissions.test.ts src/lib/job-flow/routes.test.ts`

Expected: PASS.

Run: `pnpm typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app src/lib/auth src/lib/intake/actions.ts src/lib/job-flow/routes.test.ts
git commit -m "feat: route operators through one job flow"
```

### Task 5: Guided Job Desk Shell and Themed Responsive Layout

**Files:**
- Create: `components/job-flow/job-flow-shell.tsx`
- Create: `components/job-flow/job-action-queue.tsx`
- Create: `components/job-flow/job-stage-rail.tsx`
- Create: `components/job-flow/job-summary.tsx`
- Create: `components/job-flow/job-flow-shell.test.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: serialized queue rows, selected job detail, `JobFlowStage`, active teams, and deterministic suggestions.
- Produces: desktop sidebar + queue + workspace and mobile queue → selected-job layout.

- [ ] **Step 1: Write the failing shell source-contract test**

Assert the shell renders the labels `Needs action`, `New WhatsApp job`, all five stage labels, a mobile `Back to jobs` control, semantic token classes, and no fixed `bg-white`, `text-black`, `bg-amber-50`, or native `<select>`.

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm test components/job-flow/job-flow-shell.test.ts`

Expected: FAIL because the shell files do not exist.

- [ ] **Step 3: Implement focused server-friendly components**

`JobActionQueue` renders grouped `Link` rows to `/jobs?job=<id>`, a GET search form, real next-action labels, status text in addition to color, and an empty-state action to `/jobs?mode=new`.

`JobStageRail` renders `WhatsApp`, `Assignment`, `Team report`, `Invoice`, and `Customer handoff`; completed stages use primary/audit styling, the current stage uses action styling, and future stages use muted styling.

`JobFlowShell` uses CSS grid at desktop widths and a queue-or-detail switch below `lg`. The mobile selected-job view includes `Back to jobs`; it does not render compressed desktop columns.

Export serializable `JobFlowQueueRow`, `JobFlowSelectedJob`, `JobFlowTeam`, and `JobFlowSuggestion` prop types from `job-flow-shell.tsx` for the server route to construct in Task 6.

- [ ] **Step 4: Add semantic light/dark status tokens**

Define `--action-required`, `--action-required-foreground`, `--action-required-muted`, `--audit`, and `--audit-foreground` in both `:root` and `html.dark`, expose them through `@theme inline`, and consume them through token classes. Do not replace existing theme variables or the current theme bootstrap.

- [ ] **Step 5: Run the shell test and theme regression tests**

Run: `pnpm test components/job-flow/job-flow-shell.test.ts src/lib/theme/theme.test.ts components/intake/intake-workspace.test.ts components/operations/jobs-workspace.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/job-flow app/globals.css
git commit -m "feat: add responsive guided job desk"
```

### Task 6: Stage Forms and Continuous Handoffs

**Files:**
- Create: `components/job-flow/stages/intake-stage.tsx`
- Create: `components/job-flow/stages/assign-stage.tsx`
- Create: `components/job-flow/stages/report-stage.tsx`
- Create: `components/job-flow/stages/invoice-stage.tsx`
- Create: `components/job-flow/stages/handoff-stage.tsx`
- Modify: `components/intake/intake-workspace.tsx`
- Modify: `components/billing/customer-link-actions.tsx`
- Replace: `app/(data-entry)/jobs/page.tsx`

**Interfaces:**
- Intake saves and redirects to `/jobs?job=<id>`.
- Assignment refreshes the selected job after `assignJob` returns `jobId`.
- Team report uses `saveTeamReportAndCloseout`.
- Invoice uses `createInvoiceWithPayments`.
- Handoff receives public invoice, PDF, and feedback paths as serialized strings.

- [ ] **Step 1: Write failing source-contract tests for all five stages**

Assert the stage directory contains exactly one action surface per stage; report source includes `Original WhatsApp update`, `No AI`, work outcome, payment outcome, and split-payment controls; invoice source includes dynamic items and initial payments; handoff source includes invoice, PDF, print, and feedback actions.

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm test components/job-flow`

Expected: FAIL because stage components are absent.

- [ ] **Step 3: Embed intake and assignment**

Allow `IntakeWorkspace` to render without its old outer two-column page assumptions and add a manual-entry path that initializes an empty `WhatsAppExtraction` while keeping `rawText`. `IntakeStage` wraps it in the current-stage card. `AssignStage` reuses `assignJob`, `FormSelect`, deterministic suggestion reasons, and active-job counts.

- [ ] **Step 4: Build the manual report form**

Use one client component with transient rows for split payments. Serialize rows to one hidden `payments` input and include the selected job's ISO `updatedAt` value as `expectedUpdatedAt`. Show raw team WhatsApp text separately from manual values. Status and payment-outcome changes conditionally show only relevant fields, derive visible totals during render, and never use an effect to calculate money.

- [ ] **Step 5: Build invoice and handoff forms**

Prefill one invoice line from the latest approved manual completion amount. Prefill payment rows from its audit JSON. Use `createInvoiceWithPayments` and show a direct same-job handoff after success. `HandoffStage` embeds invoice totals, payment records, `/invoice/<printableToken>`, `/api/invoice/<printableToken>/pdf`, print support, and `CustomerLinkActions` for `/feedback/<token>`.

Extend `CustomerLinkActions` with an optional invoice path and a `Copy customer message` action that copies a concise message containing both links. Keep clipboard use isolated in this client component.

- [ ] **Step 6: Build the unified server loader and connect stage selection**

Parse `mode`, `job`, `view`, and `search` from `searchParams`. Require `DATA_ENTRY` or the existing read-only job roles, then fetch the narrow queue projection and selected job detail in parallel. Load active teams and their open-job counts only for assignment. Convert Prisma decimals and dates to serializable numbers and ISO strings before constructing the Task 5 shell props.

The selected detail includes customer, address, source partner, team, latest approved completion entry, invoice items/payments/tokens, feedback token, and fields needed by `resolveJobFlowStage`. Render exactly one of the five stage components based on persisted state. Cancelled jobs render a terminal summary in `ReportStage`; completed jobs cannot return to assignment or report forms through URL parameters.

- [ ] **Step 7: Run focused tests, full tests, and typecheck**

Run: `pnpm test components/job-flow src/lib/job-flow src/lib/billing/calculations.test.ts src/lib/finance/calculations.test.ts`

Expected: PASS.

Run: `pnpm test`

Expected: all tests PASS.

Run: `pnpm typecheck`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add components/job-flow components/intake/intake-workspace.tsx components/billing/customer-link-actions.tsx app/(data-entry)/jobs/page.tsx
git commit -m "feat: connect guided job-flow stages"
```

### Task 7: Full Verification and Browser QA

**Files:**
- Modify: `docs/manual-qa.md`
- Modify only if verification finds defects: files from Tasks 1–6

- [ ] **Step 1: Run automated verification**

Run:

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Expected: every command exits 0 without new warnings.

- [ ] **Step 2: Start the application and test the desktop light-theme flow**

Run: `pnpm dev`

Verify with a Data Entry account:

1. `/jobs` is the default destination and the sidebar has one core `Job flow` item.
2. New WhatsApp intake parses, supports manual fallback, saves, and remains in the selected job.
3. Assignment advances without opening `/dispatch`.
4. Manual team report preserves raw text and rejects missing work/payment outcomes.
5. Cash and split-payment completed jobs advance to invoice.
6. Invoice issuance creates payment rows atomically and advances to handoff.
7. Invoice, PDF, print, and feedback actions are present together.

- [ ] **Step 3: Repeat visual verification in dark mode and mobile viewport**

Verify every surface, border, input, status badge, validation message, and focus ring in dark mode. At a narrow viewport, confirm queue-first navigation, full-width current stage, `Back to jobs`, visible progress strip, and reachable primary action.

- [ ] **Step 4: Verify guarded outcomes**

Test unpaid, no-charge, postponed, and cancelled closeouts. Confirm cancelled/no-charge jobs do not fabricate payments, cancelled jobs never reach invoice, and public token pages expose no internal fields.

- [ ] **Step 5: Update manual QA evidence**

Add the tested routes, roles, outcomes, viewport sizes, theme states, and observed results to `docs/manual-qa.md`.

- [ ] **Step 6: Re-run automated verification after any QA fixes**

Run `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` again.

Expected: all commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add docs/manual-qa.md
git commit -m "test: verify unified data-entry job flow"
```
