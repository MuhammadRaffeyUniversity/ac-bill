# Agent Rules for AC Bill

## Project Context

This is an internal operations system for an AC repair/installation company. The existing Excel workbook `C:\Users\Raffey\Downloads\EZY Aircond.xlsx` is the current source of truth for the business workflow.

Read `Plan.md` before making product or architecture changes.

Ali is the CEO/operator. The company receives outsourced WhatsApp clients from a Malaysian company, and that WhatsApp sender/partner earns the 25% sender commission.

## Development Rules

- Preserve unrelated user changes.
- Keep changes scoped to the requested task.
- Use the existing Next.js App Router and TypeScript setup.
- Prefer server-side business logic for money, permissions, and LLM validation.
- Do not hard-code team names, commission rates, or sender names inside UI components. Store them in configuration, seed data, or database records.
- Keep all financial calculations deterministic and covered by tests.
- The LLM may parse WhatsApp text, but it must not silently calculate money or save jobs without human review.
- Keep raw WhatsApp message text on each job for audit.
- Treat public invoice and feedback routes as tokenized read-limited pages.
- Separate company expenses from CEO/personal expenses.
- Never mix cash collected by teams with online payments without explicit payment records.
- Treat the current business setup as 6 active teams: 5 salary teams and 1 commission team.
- Do not let a job move to fully completed without recording whether the job was performed and how payment was handled: cash, online/account, split, unpaid, no-charge, or cancelled.
- Generate normal customer invoices after service/job completion confirmation, not at initial booking.

## Workbook Mapping Rules

- `Dash Board` maps to reports, not a primary table.
- `Invoice Record` maps to job-count and dispatch reporting, not final invoice records.
- `Salary Teams` maps to salary-team sales, expenses, sender commission, and company profit.
- `Commission Teams` maps to 60% team, 25% sender, 15% company split.
- `Personal Expenses` maps to owner/personal expenses.
- `Company Expenses` maps to operating expenses such as team rent.
- `Employee Records` maps to employee/team-member activity records.
- `Petty Cash` maps to the cash ledger.
- Ignore `Sheet11` and do not import `Sheet12` as AC operational data unless the user explicitly asks.

## Commands

- Install dependencies with `pnpm install` if needed.
- Run development server with `pnpm dev`.
- Run lint with `pnpm lint`.
- Add a `typecheck` script before relying on TypeScript verification.
- Prefer local project binaries on Windows, for example `node_modules\\.bin\\tsc.CMD`, if shell shims fail.

## UI Rules

- Build the actual operations dashboard as the first screen, not a marketing landing page.
- Keep the interface dense, scannable, and work-focused.
- Use clear forms, filters, tables, status badges, print views, and dialogs.
- Avoid decorative hero sections and oversized marketing cards.
- Make mobile layouts usable for team leads in the field.

## Testing Rules

- Add tests for financial calculations before connecting them to reports.
- Verify examples from the workbook:
  - Commission team: sales `560` gives team `336`, sender `140`, company `84`.
  - Salary team: sales `510`, expenses `115`, sender 25% gives company profit `267.50`.
- Verify job closeout cannot skip payment status.
- Browser-test critical flows before calling work complete: intake, assignment, completion, payment split, invoice print, feedback submission, and daily report.

## Documentation Rules

- Update `Plan.md` when a confirmed product decision changes implementation scope.
- Document workbook import assumptions in `docs/workbook-mapping.md`.
- Keep unknown business decisions explicit instead of guessing.
