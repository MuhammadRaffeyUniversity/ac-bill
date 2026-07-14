# Responsive Motion System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a CSS-first, reduced-motion-safe animation system and finish responsive hardening across AC Bill.

**Architecture:** Global motion tokens and semantic hooks provide consistent server-rendered entrances without a runtime animation library. A focused client submit button adds pending feedback to sign-in, while existing layouts opt into shared page, panel, and list contracts.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, existing shadcn/Base UI components, Vitest.

## Global Constraints

- Preserve the current light and dark themes.
- Keep financial and permission logic server-side.
- Do not add a motion dependency.
- Respect `prefers-reduced-motion`.
- Preserve unrelated working-tree changes.

---

### Task 1: Motion contracts and sign-in feedback

**Files:**
- Create: `src/lib/theme/motion-contract.test.ts`
- Create: `components/auth/sign-in-submit.tsx`
- Modify: `app/globals.css`
- Modify: `app/signin/page.tsx`

**Interfaces:**
- Produces: semantic `data-motion` hooks and `SignInSubmit`.

- [ ] Add a failing source contract test for duration tokens, reduced-motion fallback, sign-in hooks, and pending copy.
- [ ] Run `node_modules\\.bin\\vitest.CMD run src/lib/theme/motion-contract.test.ts` and confirm the missing contracts fail.
- [ ] Add the CSS motion system and pending sign-in button.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: App-wide shell and surface adoption

**Files:**
- Modify: `app/(data-entry)/layout.tsx`
- Modify: `app/(ceo)/page.tsx`
- Modify: `components/operations-shell.tsx`
- Modify: `components/job-flow/job-flow-shell.tsx`
- Modify: `components/dashboard/ceo-dashboard.tsx`
- Modify: `components/ledger/ledger-workspace.tsx`
- Modify: `components/operations/expenses-workspace.tsx`
- Modify: `components/team-setup/team-setup-workspace.tsx`
- Modify: `app/invoice/[token]/page.tsx`
- Modify: `app/feedback/[token]/page.tsx`

**Interfaces:**
- Consumes: `data-motion="page|panel|list|item"` and `--motion-order`.
- Produces: consistent app-wide motion without new client boundaries.

- [ ] Extend the failing contract test to require shell and public-page hooks.
- [ ] Run the focused test and confirm the shell-hook assertions fail.
- [ ] Add semantic hooks to shared shells and representative data surfaces.
- [ ] Re-run the focused test and confirm it passes.

### Task 3: Responsive and accessibility verification

**Files:**
- Modify only files with browser-proven responsive defects.
- Update: `docs/manual-qa.md` if the current checklist exists.

**Interfaces:**
- Consumes: existing authenticated Data Entry session and browser viewport controls.
- Produces: verified layouts at 320, 360, 768, 1024, and 1440 pixels.

- [ ] Run full Vitest, TypeScript, ESLint, and production build verification.
- [ ] Browser-check sign-in and protected Data Entry routes at every target width.
- [ ] Verify drawer navigation, dark/light themes, focus visibility, and reduced-motion behavior.
- [ ] Record any CEO browser-authentication gap explicitly instead of claiming protected CEO verification without a real admin session.
