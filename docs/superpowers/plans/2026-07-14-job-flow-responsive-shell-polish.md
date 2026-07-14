# Job Flow Responsive Shell Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `New WhatsApp job` visible from a populated mobile queue and turn the desktop Data Entry screen into a fitted, theme-aware operations console with deliberate pane scrolling.

**Architecture:** Preserve `/jobs` as a React Server Component and keep the queue-first/detail-second flow. Change only responsive composition classes, add a shared semantic scrollbar utility, and expose the existing intake link in the mobile queue header; no client state or business behavior changes are required.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Vitest, shadcn theme tokens.

## Global Constraints

- Preserve unrelated user changes and keep the patch limited to the Data Entry shell, job-flow shell, queue, scrollbar CSS, and focused tests.
- Keep `/jobs?mode=new` as the single customer-intake destination.
- Keep mobile document scrolling below `lg`; use contained pane scrolling only at `lg` and above.
- Style scrollbars without hiding them and use semantic light/dark theme tokens.
- Keep the mobile create action fully labelled with a minimum 44-pixel touch target.
- Do not change permissions, financial logic, server actions, database records, or job-stage resolution.

---

### Task 1: Lock the responsive contract with failing tests

**Files:**

- Modify: `components/job-flow/job-flow-shell.test.ts`
- Test: `components/job-flow/job-flow-shell.test.ts`

**Interfaces:**

- Consumes: static source files for the Data Entry layout, job-flow shell, job queue, and global CSS.
- Produces: regression assertions for `lg:h-dvh`, `lg:grid-rows-[auto_minmax(0,1fr)]`, `ops-scrollbar`, a mobile-only queue create action, and removal of `calc(100vh-105px)`.

- [ ] **Step 1: Add failing responsive-shell assertions**

Extend the source reads and add these assertions:

```ts
const layout = read("../../app/(data-entry)/layout.tsx");
const queue = read("./job-action-queue.tsx");
const styles = read("../../app/globals.css");

expect(layout).toContain("lg:h-dvh");
expect(layout).toContain("lg:grid-rows-[auto_minmax(0,1fr)]");
expect(queue).toContain("lg:hidden");
expect(queue).toContain('href="/jobs?mode=new"');
expect(queue).toContain("h-12");
expect(`${layout}\n${shell}\n${queue}`).not.toContain("calc(100vh-105px)");
expect(shell).toContain('showWorkspace ? "hidden lg:block" : "block", "lg:min-h-0"');
expect(shell).toContain("ops-scrollbar");
expect(queue).toContain("ops-scrollbar");
expect(styles).toContain(".ops-scrollbar");
expect(styles).toContain("scrollbar-color:");
expect(styles).toContain("::-webkit-scrollbar-thumb");
```

- [ ] **Step 2: Run the focused test and verify RED**

Run `pnpm exec vitest run components/job-flow/job-flow-shell.test.ts`.

Expected: FAIL because the mobile queue action, fitted desktop grid classes, and `ops-scrollbar` utility do not exist.

- [ ] **Step 3: Confirm the failure is behavioral**

Confirm failures point to missing class/action strings rather than a path, syntax, or test-runner error. Fix only test setup errors and rerun until the expected assertions fail.

### Task 2: Implement the mobile action and fitted desktop scroll shell

**Files:**

- Modify: `app/(data-entry)/layout.tsx`
- Modify: `components/job-flow/job-flow-shell.tsx`
- Modify: `components/job-flow/job-action-queue.tsx`
- Modify: `app/globals.css`
- Test: `components/job-flow/job-flow-shell.test.ts`

**Interfaces:**

- Consumes: existing `buttonVariants`, `cn`, `/jobs?mode=new`, semantic theme tokens, and `lg` breakpoint behavior.
- Produces: a mobile-only labelled intake link, a desktop layout sized by the actual header, independently scrolling queue/workspace panes, and the shared `ops-scrollbar` CSS utility.

- [ ] **Step 1: Fit the Data Entry shell to the desktop viewport**

```tsx
<div className="grid min-h-screen grid-cols-1 bg-muted/30 lg:h-dvh lg:min-h-0 lg:grid-cols-[232px_minmax(0,1fr)]">
  {/* existing sidebar */}
  <section className="min-w-0 lg:grid lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)]" data-motion="page">
```

- [ ] **Step 2: Make the job-flow panes own their overflow**

```tsx
<main className="min-h-0 bg-muted/30 lg:h-full" data-motion="page">
  <div className="grid min-h-0 lg:h-full grid-cols-[minmax(0,1fr)] lg:grid-cols-[310px_minmax(0,1fr)]">
    <div className={cn(showWorkspace ? "hidden lg:block" : "block", "lg:min-h-0")}>
      {/* queue */}
    </div>
    <section className={cn(showWorkspace ? "min-w-0" : "hidden lg:block", "ops-scrollbar lg:min-h-0 lg:overflow-y-auto")}>
```

Apply overflow only at `lg` so mobile keeps document scrolling.

- [ ] **Step 3: Add the mobile queue create action**

Import `PlusIcon`, `buttonVariants`, and `cn`, then render below search:

```tsx
<Link href="/jobs?mode=new" className={cn(buttonVariants(), "mt-3 h-12 w-full lg:hidden")}>
  <PlusIcon data-icon="inline-start" />
  New WhatsApp job
</Link>
```

Set the queue shell to `ops-scrollbar min-h-0 border-r bg-card lg:h-full lg:overflow-y-auto`.

- [ ] **Step 4: Add semantic scrollbar styling**

```css
.ops-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in oklab, var(--muted-foreground) 42%, transparent) transparent;
}

.ops-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.ops-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.ops-scrollbar::-webkit-scrollbar-thumb {
  min-height: 40px;
  border: 2px solid transparent;
  border-radius: 999px;
  background: color-mix(in oklab, var(--muted-foreground) 42%, transparent);
  background-clip: padding-box;
}

.ops-scrollbar::-webkit-scrollbar-thumb:hover {
  background: color-mix(in oklab, var(--primary) 72%, var(--muted-foreground));
  background-clip: padding-box;
}
```

- [ ] **Step 5: Run focused verification**

Run `pnpm exec vitest run components/job-flow/job-flow-shell.test.ts`.

Expected: PASS with all guided job desk tests green.

- [ ] **Step 6: Review scope**

Run `git diff --check` and inspect the five changed implementation/test files. Expected: no whitespace errors and no unrelated behavior changes.

### Task 3: Verify behavior and rendered UX

**Files:**

- Verify: `components/job-flow/job-flow-shell.test.ts`
- Verify: `docs/superpowers/specs/2026-07-14-job-flow-responsive-shell-polish-design.md`

**Interfaces:**

- Consumes: the completed responsive shell and authenticated `/jobs`.
- Produces: automated and browser evidence for mobile action visibility, intake navigation, desktop overflow containment, theme parity, and regression safety.

- [ ] **Step 1: Run full automated verification**

Run `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build`. Require exit code 0 for every command.

- [ ] **Step 2: Start the app for browser QA**

Run `pnpm dev` in a persistent terminal and wait for the local URL. Do not inspect secret environment files.

- [ ] **Step 3: Verify mobile at 320, 360, and 768 pixels**

At each width, verify the populated queue shows `New WhatsApp job` before selection, the control is at least 44 pixels high with no horizontal overflow, clicking opens intake, `Back to jobs` restores the queue, and scrolling remains document-based.

- [ ] **Step 4: Verify desktop at 1024 and 1440 pixels**

At each width, verify no horizontal overflow, no page scrollbar from an estimated header height, independent long-queue scrolling, and a narrow transparent-track scrollbar with teal hover contrast.

- [ ] **Step 5: Verify light/dark parity**

Repeat primary mobile and desktop checks in both themes. Capture screenshots for a populated mobile queue and desktop queue with the themed scrollbar. Confirm focus rings and labels remain readable.

- [ ] **Step 6: Final requirement review**

Run `git status --short`, `git diff --check`, and `git diff --stat`. Compare the result line-by-line with the approved design spec and report any browser-authentication or environment gap explicitly.
