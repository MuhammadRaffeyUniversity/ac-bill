# CEO Command Center Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the CEO dashboard's cluttered overview with an exception-first command center that makes urgent job decisions the primary workflow.

**Architecture:** Keep the server-rendered `app/page.tsx` as the CEO-only route and keep current sample data and auth intact. Add one small pure presenter module that maps dispatch jobs to a clear issue state, then use that presentation state to render the priority and supporting tables responsively.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Tailwind CSS, shadcn/ui, Lucide, Vitest, Auth.js.

---

## File Structure

- Create: `src/lib/dashboard/command-center.ts` — derives actionable job state and supporting on-track jobs from the existing dispatch sample rows.
- Create: `src/lib/dashboard/command-center.test.ts` — verifies payment, assignment, and review precedence for the action queue.
- Modify: `app/page.tsx` — replaces the bento-like dashboard composition with the approved command-center hierarchy.
- Modify: `app/globals.css` — adds only the small responsive dashboard utilities required to prevent table and header collisions.

### Task 1: Derive Attention Queue State

**Files:**
- Create: `src/lib/dashboard/command-center.ts`
- Create: `src/lib/dashboard/command-center.test.ts`

- [ ] **Step 1: Write the failing presentation-state tests**

```ts
import { describe, expect, it } from "vitest";

import { getCommandCenterJobs } from "./command-center";

describe("getCommandCenterJobs", () => {
  it("puts unassigned jobs ahead of payment gaps", () => {
    const result = getCommandCenterJobs([
      { id: "payment", suggestedTeam: "JB 1", payment: "Unpaid", status: "Assigned" },
      { id: "assign", suggestedTeam: "Unassigned", payment: "Not recorded", status: "Booked" },
    ]);

    expect(result.attention.map((job) => job.id)).toEqual(["assign", "payment"]);
    expect(result.attention[0].issue).toBe("Assign");
  });

  it("keeps jobs without an exception in the on-track list", () => {
    const result = getCommandCenterJobs([
      { id: "on-track", suggestedTeam: "Melaka 1", payment: "Split", status: "In progress" },
    ]);

    expect(result.attention).toEqual([]);
    expect(result.onTrack[0]).toMatchObject({ id: "on-track", issue: "On track" });
  });
});
```

- [ ] **Step 2: Run the test to confirm the module is absent**

Run: `pnpm vitest run src/lib/dashboard/command-center.test.ts`

Expected: FAIL because `./command-center` does not exist.

- [ ] **Step 3: Implement the typed mapper**

```ts
export type CommandCenterJob = {
  id: string;
  issue: "Assign" | "Payment" | "Review" | "On track";
  tone: "danger" | "warning" | "success";
};

export function getCommandCenterJobs<T extends {
  id: string;
  suggestedTeam: string;
  payment: string;
  status: string;
}>(jobs: readonly T[]) {
  const mapped = jobs.map((job) => {
    if (job.suggestedTeam === "Unassigned") return { ...job, issue: "Assign", tone: "danger" } as const;
    if (job.payment === "Unpaid" || job.payment === "Not recorded") return { ...job, issue: "Payment", tone: "warning" } as const;
    if (job.status === "Booked") return { ...job, issue: "Review", tone: "warning" } as const;
    return { ...job, issue: "On track", tone: "success" } as const;
  });

  return {
    attention: mapped.filter((job) => job.issue !== "On track"),
    onTrack: mapped.filter((job) => job.issue === "On track"),
  };
}
```

- [ ] **Step 4: Run the focused tests**

Run: `pnpm vitest run src/lib/dashboard/command-center.test.ts`

Expected: PASS with two tests.

- [ ] **Step 5: Commit the presenter unit**

```bash
git add src/lib/dashboard/command-center.ts src/lib/dashboard/command-center.test.ts
git commit -m "feat: add command center job states"
```

### Task 2: Rebuild the CEO Dashboard Composition

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Use the derived state in the CEO route**

```ts
import { getCommandCenterJobs } from "@/src/lib/dashboard/command-center";

const commandCenter = getCommandCenterJobs(dispatchJobs);
const attentionCount = commandCenter.attention.length;
```

- [ ] **Step 2: Replace the current KPI grid and side panels with the approved hierarchy**

```tsx
<section className="command-center-shell">
  <header className="command-center-header">
    <div>
      <h1>Today</h1>
      <p>Tuesday, 09 July</p>
    </div>
    <div className="command-center-actions">
      <Link href="/jobs/intake" className={buttonVariants({ variant: "default" })}>
        <PlusIcon data-icon="inline-start" />
        New job
      </Link>
      {/* Existing user, theme, report, and sign-out controls stay available here. */}
    </div>
  </header>

  <a href="#needs-attention" className="attention-banner">
    <AlertTriangleIcon />
    <span><strong>{attentionCount} jobs need attention</strong> · Review assignment and payment gaps</span>
    <span>Review now</span>
  </a>

  <AttentionTable id="needs-attention" jobs={commandCenter.attention} />
  <FinancialPulse metrics={financialPulseMetrics} />
  <OnTrackTable jobs={commandCenter.onTrack} />
</section>
```

- [ ] **Step 3: Keep components local and focused**

Create `AttentionTable`, `FinancialPulse`, `OnTrackTable`, and `IssueBadge` as small file-local components in `app/page.tsx`. Each component receives prepared props only; business decisions remain in `command-center.ts`.

- [ ] **Step 4: Add responsive constraints**

```css
.command-center-table-wrap { overflow-x: auto; }
.command-center-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 0.5rem; }

@media (max-width: 767px) {
  .command-center-desktop-table { display: none; }
  .command-center-mobile-list { display: grid; gap: 0.75rem; }
}

@media (min-width: 768px) {
  .command-center-mobile-list { display: none; }
}
```

- [ ] **Step 5: Run static verification**

Run: `pnpm typecheck`

Expected: PASS with no TypeScript errors.

Run: `pnpm lint`

Expected: PASS with no ESLint errors.

- [ ] **Step 6: Commit the dashboard slice**

```bash
git add app/page.tsx app/globals.css
git commit -m "feat: redesign CEO command center"
```

### Task 3: Verify Fidelity and Core Actions

**Files:**
- Modify only when visual defects are found in `app/page.tsx` or `app/globals.css`.

- [ ] **Step 1: Start the local app**

Run: `pnpm dev`

Expected: Next.js serves the app without server errors.

- [ ] **Step 2: Verify the authenticated desktop CEO view in the in-app browser**

Check that the first viewport has the sidebar, compact header, amber attention band, priority table, and financial pulse in that order. Confirm that no legacy KPI grid, intake review panel, or team workload panel competes above the fold.

- [ ] **Step 3: Verify the mobile CEO view at 390px width**

Check that `New job` remains reachable, each priority job becomes a readable stacked row, and the page has no horizontal overflow.

- [ ] **Step 4: Verify interactions**

Click `New job` and confirm navigation to `/jobs/intake`. Click the theme toggle and confirm the theme changes. Submit sign-out and confirm redirection to `/signin`.

- [ ] **Step 5: Compare against the approved concept**

Inspect the approved Image Gen concept and the rendered dashboard screenshot side by side. Confirm the five comparison points: queue-first hierarchy, sparse header controls, amber exception band, single horizontal financial pulse, and restrained table-driven surfaces.

- [ ] **Step 6: Commit visual corrections if required**

```bash
git add app/page.tsx app/globals.css
git commit -m "fix: refine command center fidelity"
```
