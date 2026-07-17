# Optional Team Report Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a data-entry operator submit the guided team report and closeout without an original WhatsApp update or closeout note.

**Architecture:** Keep the existing form, server action, and database schema. Relax only the two text-field constraints in the shared Zod schema, normalize blank notes at the persistence boundary, and retain every existing outcome and payment invariant.

**Tech Stack:** Next.js App Router, React, TypeScript, Zod, Prisma, Vitest

## Global Constraints

- Stay on the current branch.
- Do not add a database migration.
- Do not synthesize placeholder text for blank fields.
- Preserve the initial customer WhatsApp booking on the job.
- Keep work outcome, job outcome, service amount, payment outcome, and payment reconciliation required.
- Keep all existing closeout concurrency, authorization, and financial validation.

---

### Task 1: Accept and persist blank optional closeout text

**Files:**
- Modify: `src/lib/job-flow/schema.test.ts`
- Modify: `src/lib/job-flow/actions.test.ts`
- Modify: `src/lib/job-flow/schema.ts`
- Modify: `src/lib/job-flow/actions.ts`

**Interfaces:**
- Consumes: `teamReportCloseoutSchema` and `saveTeamReportAndCloseout`
- Produces: `TeamReportCloseoutInput` whose `rawWhatsAppText` and `note` values may be empty strings

- [ ] **Step 1: Write the failing schema tests**

Add a focused acceptance test and retain the note-length boundary:

```ts
it("accepts a closeout without an optional WhatsApp message or note", () => {
  const result = teamReportCloseoutSchema.safeParse({
    ...validReport,
    rawWhatsAppText: "",
    note: "",
  });

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.rawWhatsAppText).toBe("");
    expect(result.data.note).toBe("");
  }
});

it("limits an optional closeout note to 2,000 characters", () => {
  expect(teamReportCloseoutSchema.safeParse({ ...validReport, note: "x".repeat(2_000) }).success).toBe(true);
  expect(teamReportCloseoutSchema.safeParse({ ...validReport, note: "x".repeat(2_001) }).success).toBe(false);
});
```

Rename the existing combined audit/performed test to `rejects completed work that was not performed` and remove the assertion that rejects a short WhatsApp message.

Extend the action contract test:

```ts
expect(source).toContain("const note = data.note || undefined");
expect(source).toContain("remarks: note ?? null");
expect(source).toContain("cancellationReason: data.status === \"CANCELLED\" ? note ?? null : null");
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
pnpm test src/lib/job-flow/schema.test.ts src/lib/job-flow/actions.test.ts
```

Expected: the blank-field schema test fails because `rawWhatsAppText` and `note` currently require content, and the action source-contract test fails because blank-note normalization is absent.

- [ ] **Step 3: Implement the minimal server behavior**

Change the two schema fields:

```ts
rawWhatsAppText: z.string().trim(),
note: z.string().trim().max(2_000),
```

After `const data = result.data`, normalize only the nullable note:

```ts
const note = data.note || undefined;
```

Keep `rawWhatsAppText: data.rawWhatsAppText` because the database column is non-nullable. Use the normalized note at nullable persistence boundaries:

```ts
notes: note,
```

```ts
cancellationReason: data.status === "CANCELLED" ? note ?? null : null,
remarks: note ?? null,
```

```ts
note,
```

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run:

```bash
pnpm test src/lib/job-flow/schema.test.ts src/lib/job-flow/actions.test.ts
```

Expected: both test files pass, including blank optional fields and all existing payment/outcome cases.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/lib/job-flow/schema.test.ts src/lib/job-flow/actions.test.ts src/lib/job-flow/schema.ts src/lib/job-flow/actions.ts
git commit -m "feat: allow optional team report notes"
```

---

### Task 2: Mark the fields optional in the form and product plan

**Files:**
- Modify: `components/job-flow/stages/stages.test.ts`
- Modify: `components/job-flow/stages/report-stage.tsx`
- Modify: `Plan.md`

**Interfaces:**
- Consumes: the relaxed `teamReportCloseoutSchema`
- Produces: a Step 2/team-report form whose two text labels explicitly say `(optional)` and whose browser constraints permit blank submission

- [ ] **Step 1: Write the failing interface contract test**

Extend the first `stages.test.ts` case:

```ts
expect(report).toContain("Original WhatsApp update");
expect(report).toContain("Closeout note");
expect(report.match(/\(optional\)/g)).toHaveLength(2);
expect(report).not.toMatch(/name="rawWhatsAppText" required/);
expect(report).not.toMatch(/name="note" required/);
expect(report).not.toContain('minLength={10}');
```

- [ ] **Step 2: Run the interface test and verify RED**

Run:

```bash
pnpm test components/job-flow/stages/stages.test.ts
```

Expected: FAIL because neither label says optional and both textareas still use browser-level required constraints.

- [ ] **Step 3: Implement the minimal form copy and constraints**

Update the introductory copy:

```tsx
<p className="mt-1 text-sm text-muted-foreground">
  Paste the original WhatsApp update when available and confirm every value manually. No AI is used for completion.
</p>
```

Update both labels without changing the surrounding layout:

```tsx
<label className="grid gap-1.5 text-sm font-medium">
  Original WhatsApp update <span className="font-normal text-muted-foreground">(optional)</span>
  <textarea name="rawWhatsAppText" className="min-h-56 rounded-md border bg-background p-3 font-mono text-sm" />
</label>
```

```tsx
<label className="mt-4 grid gap-1.5 text-sm font-medium">
  Closeout note <span className="font-normal text-muted-foreground">(optional)</span>
  <textarea name="note" maxLength={2000} className="min-h-24 rounded-md border bg-background p-3 text-sm" />
</label>
```

Update `Plan.md` so the confirmed decision is explicit:

```md
- Job closeout: performed/not performed, optional completion note, and required payment status.
- Manually transcribed team-submitted WhatsApp updates when available, including raw message text and entered-by audit details; the team completion WhatsApp message is optional and this flow must not call an LLM.
```

- [ ] **Step 4: Run focused and surrounding tests**

Run:

```bash
pnpm test components/job-flow/stages/stages.test.ts src/lib/job-flow/schema.test.ts src/lib/job-flow/actions.test.ts components/job-flow/stages/payment-state.test.ts
```

Expected: all selected test files pass.

- [ ] **Step 5: Run project verification**

Run:

```bash
pnpm lint
pnpm typecheck
```

Expected: both commands exit with code 0.

- [ ] **Step 6: Verify the signed-in interface**

Open a job at the team-report stage in the existing signed-in browser session. Confirm:

- Both labels show `(optional)`.
- Neither textarea exposes a browser required constraint.
- The structured outcome, amount, and payment controls remain present.
- A closeout with both optional text fields blank can pass client/server validation when the required structured fields are valid.
- The layout has no horizontal overflow at desktop and 360-pixel mobile widths.

Save desktop and mobile screenshots under:

```text
C:/Users/Raffey/.codex/visualizations/2026/07/17/019f702c-c85f-78e2-bd5b-afb45097e6dd/
```

- [ ] **Step 7: Commit Task 2**

```bash
git add components/job-flow/stages/stages.test.ts components/job-flow/stages/report-stage.tsx Plan.md
git commit -m "feat: mark team report text optional"
```

