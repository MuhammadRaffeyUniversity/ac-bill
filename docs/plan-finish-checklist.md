# Plan Completion Checklist

Use this checklist in the next implementation chat. It reflects the current code audit, not just the checkboxes in `Plan.md`.

## First: Resolve Required Decisions

- [ ] Confirm final six active teams: five salary teams and one commission team.
- [ ] Provide each team's confirmed name, region, service areas, and compensation type.
- [ ] Confirm the default commission rules, including sender/partner rate and whether commission is calculated before or after discounts.
- [ ] Confirm whether a completed job may exist briefly before its invoice is issued, or whether invoice issuance must be part of the completion transaction.
- [ ] Confirm the reconciliation definition for daily earnings versus balance received, including opening balance and treatment of cash held by teams.
- [ ] Provide a redacted July 2026 workbook snapshot for a limited validation import.

## P0: Financial Lifecycle

- [ ] Rework completion and invoicing so the agreed job lifecycle cannot violate the final-invoice rule.
  - Acceptance: a performed job cannot reach its final state without the required invoice/payment outcome.
  - Acceptance: cancellation, no-charge, unpaid, and split-payment cases remain valid and audited.
- [ ] Create `CommissionEntry` records when an invoice is issued or finalized.
  - Acceptance: salary-team and commission-team jobs use the effective `CommissionRule`.
  - Acceptance: commission entries preserve sales, team, sender, company, expense, and net-company-profit amounts.
  - Acceptance: finance calculations remain deterministic and unit-tested.
- [ ] Seed the confirmed teams and commission rules after the final business data is supplied.
  - Acceptance: exactly five active salary teams and one active commission team exist.
  - Acceptance: no team names, rates, or sender names are hard-coded in UI components.

## P0: CEO Monitoring and Reconciliation

- [ ] Replace the current `today` / `7d` / `30d` selector with daily, weekly, monthly, and yearly report periods.
- [ ] Add CEO-only salary-team and commission-team report views.
- [ ] Add CEO-only sender/partner commission reporting backed by database records.
- [ ] Add daily reconciliation for invoiced sales, cash collected, online payments, team cash held, approved team expenses, company expenses, personal expenses, and balance received.
- [ ] Show explicit empty states when an agreed reconciliation input is absent instead of presenting a misleading zero.
- [ ] Add tests for the reconciliation calculation and the report-period boundaries.

## P1: Intake Quality

- [ ] Normalize WhatsApp requested date/time into a consistent Malaysia-aware value.
- [ ] Normalize common service-type variants and unit-count wording before review.
- [ ] Add parser tests for messy phone, date/time, service, and unit-count examples.
- [ ] Keep raw WhatsApp text and all human edits auditable.

## P1: Workbook Validation Import

- [ ] Build a limited, idempotent import for an approved redacted July 2026 snapshot.
- [ ] Record source-row references and team-name alias decisions.
- [ ] Exclude `Sheet11` and `Sheet12` from operational import.
- [ ] Compare imported totals with workbook totals and CEO reports.
- [ ] Document every mismatch, especially workbook formulas that omit expenses.

## P2: Partner and Documentation

- [ ] Replace sample partner rows with a database-backed partner commission report.
- [ ] Add a project setup section to `README.md` without exposing secret values.
- [ ] Document safe environment-variable presence checks and database migration steps.
- [ ] Update `Plan.md` to resolve stale role contradictions:
  - Data Entry owns intake and operational expense entry.
  - CEO remains dashboard-only and read-only.
  - Dispatcher intake access must follow the confirmed Data Entry-only decision.

## Final Verification

- [ ] Run `pnpm test`.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm lint` and resolve remaining warnings.
- [ ] Run `pnpm build`.
- [ ] Run the app locally with a Data Entry account and a CEO account.
- [ ] Browser-test intake, team setup, assignment, closeout, invoice, split payment, invoice print, public invoice, feedback, ledger entry, CEO reporting, and partner reporting.
- [ ] Verify CEO cannot access operational entry routes.
- [ ] Verify Data Entry cannot access CEO-only reports.
- [ ] Mark only evidence-backed items complete in `Plan.md`.
