# Unified Data-Entry Job Flow Design

**Date:** 2026-07-13

**Status:** Approved interaction and visual direction

## Objective

Replace the scattered data-entry journey with one guided job desk that carries an operator through the complete operational flow:

1. Paste the customer WhatsApp booking.
2. Review the extracted booking and create the job.
3. Assign an active team.
4. Record the team's WhatsApp completion report manually.
5. Confirm work and payment handling.
6. Issue the invoice and record payments.
7. Give the operator the invoice PDF and customer feedback link.

The operator must not navigate among separate Intake, Dispatch, Jobs, Team updates, and Invoices screens to complete one job.

## Product Boundaries

This redesign changes the data-entry interface and its workflow orchestration. It does not redesign the CEO dashboard, finance reports, company expenses, personal expenses, petty cash, or team setup.

The existing financial rules, permissions, public invoice route, public feedback route, audit requirements, and database records remain authoritative. The redesign may compose existing server actions or introduce focused orchestration actions, but it must not move money, permission, or validation logic into client components.

## Primary Surface

`/jobs` becomes the data-entry operator's primary **Job flow** surface. The sidebar contains one core operational destination, `Job flow`, and retains only supporting destinations that are not stages of a job, such as `Expenses` and `Teams`.

The separate operational destinations are removed from the data-entry navigation:

- Intake
- Dispatch
- Team updates
- Invoices

Existing URLs remain as compatibility entry points and redirect into the equivalent state of `/jobs` so bookmarks and server-action redirects do not break. Public invoice and feedback URLs remain unchanged.

The unified route uses URL state so selections are linkable and recoverable:

- `/jobs` opens the action queue.
- `/jobs?mode=new` opens WhatsApp intake in the workspace.
- `/jobs?job=<job-id>` opens the selected job at its current stage.

## Desktop Layout

The desktop interface has three persistent regions:

1. A narrow application sidebar for `Job flow`, `Expenses`, and `Teams`.
2. A job queue showing records that need operator action.
3. A selected-job workspace showing the five-stage progress rail and only the current action.

The top bar contains the operator identity, theme control, sign-out action, and a prominent `New WhatsApp job` action.

The queue is grouped by the action the operator understands:

- Record team report
- Create invoice
- Assign team
- Waiting for team
- Recently completed

Actionable groups appear before waiting and completed groups. Within a group, requested service time comes first, followed by creation time. Search matches customer name, normalized phone number, job number, address, and assigned team. Queue records carry only the information needed for scanning: customer, job number, service summary, location, assigned team, and next action.

Selecting a queue record changes the URL and selected workspace without opening another operational page.

## Mobile Layout

The desktop columns are not compressed onto a phone.

- The first mobile screen is the job queue.
- Selecting a job opens its current-stage workspace as a full screen.
- A back action returns to the same queue filter and scroll position.
- The five-stage rail becomes a compact horizontal progress strip.
- Forms use one column.
- The primary action remains reachable at the bottom without hiding validation messages.

## Five-Stage Job Model

The interface presents five operator-facing stages. These are a view of existing business state, not a new client-only wizard state.

### Stage 1: WhatsApp

`New WhatsApp job` opens intake inside the selected-job workspace.

- The complete raw customer WhatsApp message is pasted once and preserved.
- AI extracts booking fields only.
- The operator reviews and edits required customer, address, scheduling, unit, and service fields.
- AI confidence and missing fields remain visible but secondary.
- A parse failure offers retry and manual entry; it never discards the pasted message.
- Saving creates a reviewed `BOOKED` job and advances the same workspace to assignment.

### Stage 2: Assignment

The workspace shows the newly created or currently unassigned job alongside active team suggestions.

- Suggestions remain deterministic and explain their service-area and workload reasoning.
- The operator selects an active team and may add an override or handoff note.
- Saving records assignment history and advances the job to the team-report stage.

### Stage 3: Team Report

This stage has two states: `Waiting for team` and `Record report`.

- The waiting state summarizes the customer, service, assigned team, and booking message without presenting unrelated forms.
- When the team reports through WhatsApp, the operator pastes the complete raw team message into the same stage.
- No AI parses a team completion message.
- The operator manually confirms whether work was performed, completion status, service amount, payment outcome, payment rows, and a closeout note.
- Cash, online, card/other, split, unpaid, no-charge, postponed, and cancelled outcomes remain explicit.
- Confirmation stores the team-submitted audit entry, its manually entered amount and payment rows, and the job closeout outcome together so the operator does not approve the update on another screen. Until invoice issuance, those reported payment details remain audit data on the team entry rather than financial `Payment` records.
- The action cannot mark a job completed without required work and payment outcomes.
- Successful confirmation advances the same job to invoice creation.

### Stage 4: Invoice

The invoice form opens preselected for the completed job.

- Invoice lines are prefilled from the manually confirmed completion amount when available.
- The operator may edit descriptions, quantities, prices, discount, tax, due date, and split-payment details before issuance.
- Totals and payment status are calculated with deterministic server-side functions.
- Invoice creation and the confirmed payment rows are saved in one transaction.
- A no-charge job follows the explicit no-charge path and does not fabricate a paid invoice.
- A successful issue advances to customer handoff.

### Stage 5: Customer Handoff

The final stage groups the post-service deliverables in one place:

- Invoice summary and payment balance
- Open customer invoice
- Download PDF
- Print invoice
- Copy or open the tokenized feedback link
- Copy a concise customer handoff message containing the invoice and feedback links

The customer handoff stage never exposes internal job, payment, commission, or audit data through public routes.

## Stage Resolution

A server-side pure function derives the operator stage from persisted state. The browser does not decide which business step is complete.

```ts
type JobFlowStage =
  | "WHATSAPP"
  | "ASSIGNMENT"
  | "TEAM_REPORT"
  | "INVOICE"
  | "CUSTOMER_HANDOFF";
```

Resolution follows these rules:

1. `mode=new` without a persisted job is `WHATSAPP`.
2. A persisted job without an assigned team is `ASSIGNMENT`.
3. An assigned job without a confirmed completion outcome is `TEAM_REPORT`.
4. A completed job without an invoice is `INVOICE`.
5. A job with an invoice is `CUSTOMER_HANDOFF`.

Cancelled jobs remain visible as terminal records and do not advance to invoice or customer handoff. Postponed jobs remain in the team-report stage with their postponed status clearly shown.

## Component Boundaries

The unified experience is split by responsibility rather than implemented as one large client component.

```text
app/(data-entry)/jobs/page.tsx                 Server route and parallel data loading
components/job-flow/job-flow-shell.tsx         Desktop/mobile workspace composition
components/job-flow/job-action-queue.tsx       Searchable, grouped queue
components/job-flow/job-stage-rail.tsx         Persisted stage summary
components/job-flow/job-summary.tsx            Stable customer/job context
components/job-flow/stages/intake-stage.tsx    Customer WhatsApp parse and review
components/job-flow/stages/assign-stage.tsx    Team suggestion and assignment
components/job-flow/stages/report-stage.tsx    Manual team report and closeout
components/job-flow/stages/invoice-stage.tsx   Invoice and payment editor
components/job-flow/stages/handoff-stage.tsx   PDF, print, and feedback actions
src/lib/job-flow/stage.ts                       Pure stage resolution
src/lib/job-flow/queue.ts                       Queue grouping and priority
src/lib/job-flow/actions.ts                     Authenticated orchestration actions
```

Existing focused intake, dispatch, closeout, billing, feedback, and financial functions remain reusable. The job-flow layer coordinates them and owns redirects to the next stage; it does not duplicate financial calculations.

## React and Next.js Behavior

The `/jobs` page remains a React Server Component. It loads the minimal queue projection and the selected job detail in parallel when a job is selected. Supporting team data is loaded only for stages that require it.

Client components are limited to interactions that need transient state:

- WhatsApp parsing and editable extraction
- Dependent team/job controls
- Dynamic invoice lines
- Split-payment rows
- Copy-link feedback

Derived values such as current stage, queue group, outstanding balance, and form eligibility are calculated during server render or in pure shared functions. They are not synchronized through `useEffect`.

Server actions authenticate and authorize every mutation. Independent reads use parallel loading, route payloads use narrow Prisma `select` projections, and stage components import directly rather than through broad barrel files.

## Theme and Visual System

The visual concept is a **live service docket**. The progress rail resembles a work order moving across a desk. Its numbering is functional because order matters.

The interface supports the existing light and dark theme control. React components use semantic shadcn tokens for backgrounds, cards, text, muted surfaces, borders, inputs, primary actions, destructive actions, and focus rings. Theme-specific status tokens cover waiting, required action, success, and audit states.

No component hard-codes white surfaces or light-only status colors. Amber is reserved for the next required operator action in both themes. Teal remains the primary completion and navigation color. Geist Sans remains the interface typeface; Geist Mono is limited to job numbers, stage metadata, amounts, and audit details.

The interface remains dense and work-focused. Controls are compact, keyboard focus is visible, color is not the only status indicator, and reduced-motion preferences are respected.

## Errors and Recovery

- AI intake failure keeps the raw message and offers retry or manual entry.
- Validation errors appear inside the current stage and do not reset completed fields.
- An assignment cannot use an inactive or missing team.
- Closeout cannot skip performed status or payment outcome.
- Invoice issuance cannot precede confirmed completion.
- Duplicate submissions are rejected or made idempotent by checking current persisted state inside the transaction.
- If another operator changes the selected job, the mutation returns a clear stale-state message and refreshes the persisted stage rather than silently overwriting it.
- Database failures do not advance the stage visually.
- Public invoice and feedback links remain tokenized and read-limited.

## Permissions

Data Entry can perform the full job flow. Any dispatcher access remains limited to the stages already permitted by server-side role checks. Team leads continue to use their team worklist and cannot access data-entry closeout, invoice, or feedback controls. CEO dashboard access remains read-only and separate.

Hidden buttons are not the permission boundary. Each server action enforces role and record access independently.

## Compatibility and Migration

The first implementation keeps existing database models and public routes. Schema changes are avoided unless implementation proves that persisted split-payment handoff data cannot be represented safely with current records.

Compatibility redirects map old internal entry points into the unified flow:

- `/jobs/intake` to `/jobs?mode=new`
- `/dispatch` to `/jobs?view=assignment`
- `/team-entries` to `/jobs?view=team-report`
- `/invoices` to `/jobs?view=invoice`
- `/invoices/<invoice-id>` to the associated `/jobs?job=<job-id>` customer-handoff stage

The sidebar exposes only `Job flow`; redirects exist for compatibility, not as parallel user experiences.

## Verification

Automated tests cover:

- Stage resolution for new, unassigned, assigned, postponed, cancelled, completed-uninvoiced, and invoiced jobs
- Queue grouping and priority
- Role-based stage mutation permissions
- Closeout rejection when work or payment outcome is missing
- Commission and salary-team examples already required by the workbook
- Invoice totals and split-payment balance
- Compatibility redirect destinations
- Theme token definitions for both light and dark modes

Browser verification covers the critical operator journey in both desktop and mobile viewports:

1. Paste and parse a customer WhatsApp message.
2. Review and save the job.
3. Assign a team without leaving the job workspace.
4. Reopen the job and manually record a team WhatsApp completion report.
5. Record cash, online, split, unpaid, and no-charge outcomes.
6. Issue the invoice.
7. Open and print or download the invoice PDF.
8. Open and submit the feedback form.
9. Repeat the primary flow in light and dark themes.

Completion requires `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and browser evidence for the critical flow.

## Confirmed Decisions

- Use the guided job desk instead of a full-screen wizard or kanban board.
- Make `/jobs` the unified operational surface.
- Keep one action queue and one current-stage workspace.
- Remove stage-specific destinations from the data-entry sidebar.
- Preserve supporting Expenses and Teams destinations.
- Derive the stage from persisted server state.
- Keep customer intake AI-assisted and team completion entry fully manual.
- Create invoice and payment records together at the invoice stage.
- Keep invoice PDF and feedback actions together in customer handoff.
- Support both light and dark themes through semantic tokens.
- Use a queue-first, job-detail-second mobile flow.
