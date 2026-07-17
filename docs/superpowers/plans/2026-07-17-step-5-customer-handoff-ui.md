# Step 5 Customer Handoff UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat Step 5 action panel with a responsive guided handoff manifest while preserving its four customer-delivery actions and existing server/client boundary.

**Architecture:** Keep `HandoffStage` server-rendered and calculate display-only invoice totals there. Render the static document step and financial summary on the server, while keeping clipboard state and failure feedback inside the existing `CustomerLinkActions` client island. Use existing semantic theme tokens and shadcn button/card patterns, without changing data fetching, permissions, invoice paths, or feedback paths.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/Base UI components, Lucide icons, Vitest.

## Global Constraints

- Work directly on the current branch; do not create a branch or worktree.
- Preserve the four existing actions: open customer invoice, download PDF, open customer review form, and copy customer message.
- Keep `Print Invoice` and `Copy Review` absent.
- Do not change financial calculations, persistence, routing, permissions, or public customer pages.
- Use existing semantic light/dark tokens instead of hard-coded component colors.
- Keep `HandoffStage` server-rendered and `CustomerLinkActions` as the only client island.
- Make the layout usable at 320, 360, 768, 1024, and 1440 pixel widths.
- Preserve visible keyboard focus and reduced-motion behavior from the shared component system.

---

### Task 1: Lock the guided handoff hierarchy with a failing source contract

**Files:**

- Modify: `components/job-flow/stages/stages.test.ts`
- Verify: `components/job-flow/stages/handoff-stage.tsx`
- Verify: `components/billing/customer-link-actions.tsx`

**Interfaces:**

- Consumes: the existing `HandoffStage` and `CustomerLinkActions` source files.
- Produces: a source contract for the ready state, financial summary, ordered document/message steps, four preserved actions, accessible clipboard status, and removed legacy controls.

- [ ] **Step 1: Extend the failing Step 5 test**

Add these assertions to the existing `keeps customer deliverables together` test:

```ts
expect(handoff).toContain("Ready to send");
expect(handoff).toContain("Customer documents");
expect(handoff).toContain("Total");
expect(handoff).toContain("Paid");
expect(handoff).toContain("Due");
expect(handoff).toContain('aria-label="Step 1"');
expect(linkActions).toContain("Send to customer");
expect(linkActions).toContain('aria-label="Step 2"');
expect(linkActions).toContain('aria-live="polite"');
expect(linkActions).toContain("Could not copy");
expect(linkActions).toContain("Includes the invoice and feedback links");
expect(linkActions).not.toContain("Copy review");
```

Keep the current assertions for:

```ts
expect(handoff).toContain("Open customer invoice");
expect(handoff).toContain("Download PDF");
expect(linkActions).toContain("Open customer review form");
expect(linkActions).toContain("Copy customer message");
expect(handoff).not.toContain("Print invoice");
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
pnpm test components/job-flow/stages/stages.test.ts
```

Expected: FAIL because the current flat panel does not contain the guided manifest labels or accessible clipboard feedback.

- [ ] **Step 3: Commit the red test only if a checkpoint is needed**

Do not commit a permanently failing branch. Continue directly to Task 2 in the same working session.

---

### Task 2: Build the server-rendered handoff manifest

**Files:**

- Modify: `components/job-flow/stages/handoff-stage.tsx`
- Test: `components/job-flow/stages/stages.test.ts`

**Interfaces:**

- Consumes:
  - `HandoffStage({ invoiceNumber, total, paid, invoicePath, pdfPath, feedbackPath })`
  - `CustomerLinkActions({ feedbackPath, invoicePath })`
- Produces:
  - a server-rendered ready-state header;
  - total, paid, and due figures;
  - the ordered `Customer documents` step;
  - unchanged invoice and PDF links;
  - the existing client component as Step 2.

- [ ] **Step 1: Add semantic imports and calculate display values once**

Use:

```ts
import { CheckCircle2Icon, ExternalLinkIcon, FileDownIcon } from "lucide-react";

import { CustomerLinkActions } from "@/components/billing/customer-link-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
```

Inside `HandoffStage`, calculate:

```ts
const due = Math.max(0, total - paid);
const invoiceFigures = [
  { label: "Total", value: total, tone: "default" },
  { label: "Paid", value: paid, tone: "success" },
  { label: "Due", value: due, tone: due > 0 ? "warning" : "success" },
] as const;
```

- [ ] **Step 2: Replace the flat panel with the manifest structure**

Render one `section` with:

```tsx
<section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
  <header className="grid gap-5 border-b bg-gradient-to-br from-audit/70 via-card to-card p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Stage 5 of 5</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">Customer handoff</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Prepare the customer documents, then copy the final message with both secure links.
      </p>
    </div>
    <Badge variant="outline" className="h-7 gap-1.5 border-audit-foreground/20 bg-audit text-audit-foreground">
      <CheckCircle2Icon data-icon="inline-start" />
      Ready to send
    </Badge>
  </header>

  <div className="grid border-b sm:grid-cols-3">
    {invoiceFigures.map((figure) => (
      <div key={figure.label} className="border-b px-5 py-4 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{figure.label}</p>
        <p className={cn("mt-1 font-mono text-xl font-semibold tabular-nums", {
          "text-audit-foreground": figure.tone === "success",
          "text-action-required-foreground": figure.tone === "warning",
        })}>
          RM {figure.value.toFixed(2)}
        </p>
      </div>
    ))}
  </div>

  <div className="grid gap-4 p-5 sm:p-6" aria-label="Step 1">
    <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
      <span className="font-mono text-sm font-semibold text-primary">01</span>
      <div>
        <h3 className="font-semibold">Customer documents</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Invoice <span className="font-mono text-foreground">{invoiceNumber}</span> is ready to open or download.
        </p>
      </div>
    </div>
    <div className="grid gap-2 sm:ml-8 sm:grid-cols-2 lg:max-w-xl">
      <a href={invoicePath} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}>
        <ExternalLinkIcon data-icon="inline-start" />
        Open customer invoice
      </a>
      <a href={pdfPath} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
        <FileDownIcon data-icon="inline-start" />
        Download PDF
      </a>
    </div>
  </div>

  <CustomerLinkActions feedbackPath={feedbackPath} invoicePath={invoicePath} />
</section>
```

Use a simple class-selection expression rather than introducing client state or effects. Keep all monetary formatting deterministic and display-only.

- [ ] **Step 3: Run the focused stage test**

Run:

```powershell
pnpm test components/job-flow/stages/stages.test.ts
```

Expected: the handoff assertions pass; clipboard-feedback assertions remain red until Task 3.

---

### Task 3: Redesign the minimal clipboard client island

**Files:**

- Modify: `components/billing/customer-link-actions.tsx`
- Test: `components/job-flow/stages/stages.test.ts`

**Interfaces:**

- Consumes:
  - `feedbackPath: string`
  - `invoicePath?: string`
  - `navigator.clipboard.writeText`
- Produces:
  - the ordered `Send to customer` step;
  - open-review action;
  - dominant copy-message action;
  - accessible `idle`, `copied`, and `error` feedback.

- [ ] **Step 1: Keep state primitive and event-driven**

Replace the boolean state with:

```ts
type CopyState = "idle" | "copied" | "error";

const [copyState, setCopyState] = useState<CopyState>("idle");
```

Do not add `useEffect`. Keep URL construction and clipboard interaction inside the click handler so no state is subscribed merely for an event callback.

- [ ] **Step 2: Add clipboard failure handling**

Use:

```ts
async function copyCustomerMessage() {
  const feedbackUrl = new URL(feedbackPath, window.location.origin).toString();
  const invoiceUrl = invoicePath ? new URL(invoicePath, window.location.origin).toString() : null;
  const lines = [
    "Thank you for choosing Ezy Aircond.",
    invoiceUrl ? `Invoice: ${invoiceUrl}` : null,
    `Feedback: ${feedbackUrl}`,
  ].filter(Boolean);

  try {
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopyState("copied");
  } catch {
    setCopyState("error");
  }
}
```

- [ ] **Step 3: Render Step 2 as a responsive action row**

Use module-level imports:

```ts
import { CheckIcon, CopyIcon, ExternalLinkIcon, MessageSquareTextIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
```

Render:

```tsx
<div className="grid gap-4 border-t bg-muted/20 p-5 sm:p-6" aria-label="Step 2">
  <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
    <span className="font-mono text-sm font-semibold text-primary">02</span>
    <div>
      <h3 className="font-semibold">Send to customer</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Includes the invoice and feedback links in one ready-to-send message.
      </p>
    </div>
  </div>
  <div className="grid gap-2 sm:ml-8 sm:grid-cols-2 lg:max-w-xl">
    <a href={feedbackPath} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}>
      <ExternalLinkIcon data-icon="inline-start" />
      Open customer review form
    </a>
    <Button type="button" size="lg" className="w-full" onClick={copyCustomerMessage}>
      {copyState === "copied" ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
      {copyState === "copied" ? "Customer message copied" : "Copy customer message"}
    </Button>
  </div>
  <p aria-live="polite" className={cn("min-h-5 text-xs sm:ml-8", copyState === "error" ? "text-destructive" : "text-muted-foreground")}>
    {copyState === "error"
      ? "Could not copy the customer message. Check browser clipboard access and try again."
      : copyState === "copied"
        ? "The customer message is ready to paste into WhatsApp."
        : "The copied message includes both secure customer links."}
  </p>
</div>
```

Remove any unused icon import during implementation.

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
pnpm test components/job-flow/stages/stages.test.ts components/job-flow/job-flow-shell.test.ts
pnpm lint
pnpm typecheck
```

Expected: all focused tests, lint, and TypeScript checks exit 0.

- [ ] **Step 5: Commit the redesign**

Run:

```powershell
git add -- components/job-flow/stages/handoff-stage.tsx components/billing/customer-link-actions.tsx components/job-flow/stages/stages.test.ts
git commit -m "feat: redesign customer handoff stage"
```

---

### Task 4: Browser QA and visual delivery

**Files:**

- Verify: `components/job-flow/stages/handoff-stage.tsx`
- Verify: `components/billing/customer-link-actions.tsx`
- Capture: Codex visualization artifacts outside the repository.

**Interfaces:**

- Consumes: a signed-in Data Entry session and an existing Step 5 job.
- Produces: desktop and 360-pixel mobile screenshots plus responsive and interaction evidence.

- [ ] **Step 1: Open a persisted Step 5 job**

Navigate to the signed-in Job Flow, choose a row under `Customer handoff`, and verify the DOM includes:

```text
Ready to send
Total
Paid
Due
Customer documents
Open customer invoice
Download PDF
Send to customer
Open customer review form
Copy customer message
```

Confirm `Print Invoice` and `Copy Review` are absent.

- [ ] **Step 2: Verify clipboard success**

Click `Copy customer message` once. Confirm the button label becomes `Customer message copied` and the live status says the message is ready to paste into WhatsApp. Do not submit invoices, payments, feedback, or other financial records.

- [ ] **Step 3: Verify responsive layout**

At 360 pixels, evaluate:

```js
({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
})
```

Expected: `scrollWidth <= clientWidth`. Confirm both document and message actions stack to full-width controls.

- [ ] **Step 4: Capture and show the interface**

Capture:

- a desktop Step 5 screenshot at 1440 × 900;
- a mobile Step 5 screenshot at 360 × 800.

Reset the temporary viewport after capture and leave the desktop Step 5 tab open as the deliverable.

- [ ] **Step 5: Final audit**

Run:

```powershell
git status --short
git diff --check
git log --oneline -5
```

Expected: no unintended working-tree changes and the redesign commit at the top of the current branch.
