# Team Salaries and Commission Payouts Design

## Context

AC Bill already distinguishes salary teams from commission teams and contains deterministic revenue-split calculations. It does not yet record formal salary liabilities, member-level commission liabilities, or the transactions that settle those liabilities.

This feature adds auditable obligations and payouts without turning the CEO dashboard into an operational entry screen or mixing team compensation with customer payments, company expenses, personal expenses, petty cash, or workbook-import activity rows.

## Confirmed Business Rules

- Every active team has exactly two active members before compensation obligations can be generated.
- Each salary team receives RM 2,000 per calendar month.
- A salary team produces two member-level obligations of RM 1,000 each per calendar month.
- Salary obligations are generated automatically and idempotently when Data Entry opens the payout workspace for a month.
- A commission team receives 60% of commissionable invoice sales.
- The WhatsApp sender receives 25% and the company receives 15%.
- The commission team share is split equally between its two active members. Each member receives 30% of commissionable invoice sales.
- Commissionable invoice sales are the invoice subtotal after discount and before tax.
- Commission becomes earned and payable when the invoice is issued, not when the job is completed or the customer pays.
- Salary and commission obligations are settled in full. Partial payout transactions are not allowed.
- Data Entry records payouts.
- The CEO sees read-only aggregate payout reporting on the existing dashboard.
- Dispatchers, team leads, partner viewers, and customers cannot view or change internal team payout records.

## Goals

- Distinguish amounts earned, amounts owed, and amounts actually paid.
- Prevent duplicate monthly salary obligations and duplicate invoice commission obligations.
- Allocate every team payout to a specific active member.
- Preserve the existing 60% team, 25% sender, and 15% company calculation.
- Keep salary, commission, sender share, company share, customer collection, and actual payout settlement independently auditable.
- Make payout calculations deterministic, server-side, and covered by tests.

## Non-Goals

- Hourly wages, overtime, bonuses, deductions, statutory payroll, tax withholding, leave, attendance, and payslips.
- Partial payouts or installment schedules.
- Letting the CEO create, edit, approve, or pay obligations.
- Letting team leads see other members' compensation.
- Automatically treating a team payout as a company expense or petty-cash movement.
- Reversing an already-paid obligation without a future explicit correction workflow.

## Data Model

### Team

Add `monthlySalaryAmount Decimal? @db.Decimal(12, 2)`.

- Seed each salary team with `2000.00`.
- Commission teams store `null`.
- New salary teams receive the server-configured RM 2,000 amount.
- The value lives in the database and is never hard-coded inside UI components.

### PayoutObligation

Add a dedicated model with:

- `id`
- `type`: `SALARY` or `COMMISSION`
- `status`: `DUE`, `PAID`, or `VOID`
- `teamId`
- `teamMemberId`
- `invoiceId`, nullable and populated for commission obligations
- `periodKey`, nullable and formatted as `YYYY-MM` for salary obligations
- `sourceKey`, globally unique
- `amount Decimal(12, 2)`
- `earnedAt`
- `voidedAt`, nullable
- `voidReason`, nullable
- timestamps and relations

Salary source keys use `salary:{teamId}:{teamMemberId}:{YYYY-MM}`.

Commission source keys use `commission:{invoiceId}:{teamMemberId}`.

The unique source key makes obligation generation idempotent even when a request is retried.

### Payout

Add a dedicated one-to-one settlement model with:

- `id`
- `obligationId`, unique
- `amount Decimal(12, 2)`
- `method`, reusing the existing payment-method enum
- `referenceNumber`, nullable
- `note`, nullable
- `paidAt`
- `recordedById`
- timestamps and relations

The payout amount must equal the obligation amount. Creating a payout changes the obligation from `DUE` to `PAID` in the same transaction.

### Existing Records

`CommissionEntry` remains the authoritative invoice-level revenue allocation:

- Salary team: team amount `0`; sender amount `25%`; company amount is commissionable sales minus sender share, before later approved team expenses.
- Commission team: team amount `60%`; sender amount `25%`; company amount `15%`.

`EmployeeRecord` remains a workbook-style activity record and is not reused as a payroll liability.

`AuditLog` records payout creation and obligation voiding with the actor, entity, before state, and after state.

## Calculation Boundaries

All calculations use integer cents internally and return two-decimal monetary values.

Pure functions provide:

- Salary allocation: RM 2,000 and two members returns RM 1,000 per member and RM 2,000 total.
- Commission allocation: commissionable sales and the effective 60%/25%/15% rule returns team, sender, and company shares plus two equal member shares.
- Commissionable sales: `subtotal - discount`; tax is excluded.
- Full-payout validation: payout amount must exactly equal the due obligation.

Required reference examples:

- Salary team: RM 2,000 returns RM 1,000 and RM 1,000.
- Commission invoice: RM 560 commissionable sales returns RM 336 team share, RM 168 per member, RM 140 sender share, and RM 84 company share.

## Salary Obligation Lifecycle

The payout workspace accepts a `YYYY-MM` month and interprets it in the `Asia/Kuala_Lumpur` business calendar.

When Data Entry opens the month:

1. Load active salary teams.
2. For each team, load active members.
3. If there are exactly two active members and a valid RM 2,000 salary amount, upsert two RM 1,000 obligations using their unique source keys.
4. If a team is invalid, do not guess or split across a different member count. Show a visible setup exception for that team while valid teams continue generating.
5. Return all obligations and payout states for the selected month.

Repeated page loads do not create duplicates.

## Commission Obligation Lifecycle

Invoice issuance becomes one atomic transaction:

1. Recheck that the job is eligible for invoice issuance.
2. Load the assigned team, its two active members, required source partner, and effective commission rule.
3. Calculate commissionable sales from subtotal after discount and before tax.
4. Create the invoice, invoice items, initial customer payments, and feedback record.
5. Create the invoice-level `CommissionEntry`.
6. For a commission team, create one 30% obligation for each active member.
7. Commit all records together.

If the job lacks its source partner, or a commission team lacks exactly two active members or an effective rule whose rates are 60%/25%/15%, invoice issuance stops with a clear configuration error. The system must not issue an invoice while silently omitting its sender or team payout liabilities.

An unpaid commission obligation may be voided when an invoice is voided, with an `AuditLog` entry. A paid obligation is never silently reversed.

## Payout Workflow

Add a Data Entry–only `/payouts` workspace and navigation item.

The workspace contains:

- Month selector.
- Summary totals for salary due, salary paid, commission due, and commission paid.
- Member-level rows grouped by team.
- Filters for type, team, and status.
- A setup-exception panel for teams that do not have exactly two active members.
- A `Record full payout` action for each due obligation.

The payout form requires:

- Payment method.
- Paid date.
- Optional reference number.
- Optional note.

The server action:

1. Requires the `DATA_ENTRY` role.
2. Reloads the obligation inside a transaction.
3. Requires status `DUE`.
4. Uses the obligation amount rather than trusting a client-entered amount.
5. Creates exactly one payout.
6. Changes the obligation to `PAID`.
7. Creates an `AuditLog`.
8. Revalidates the payout workspace and CEO dashboard.

Repeat submissions return an already-paid error and cannot create a second settlement.

## Team Setup

Creating a new team requires two distinct member names. The team and both `TeamMember` rows are created in one transaction.

The Teams screen displays the two active members for each team. Existing seeded teams already contain two member records. Compensation generation reports, rather than hides, any legacy team whose member records are incomplete.

## Permissions and Reporting

- Data Entry can open the payout workspace, generate monthly salary obligations through page access, and record payouts.
- CEO/admin remains dashboard-only and read-only.
- The CEO dashboard adds aggregate salary due/paid and commission due/paid values for its selected reporting period.
- Dispatcher, team lead, viewer, partner viewer, and public customer routes cannot access payout records.
- Partner reporting continues to expose only the sender's 25% share and never exposes team salaries or member payout details.

## Error Handling and Audit

- Invalid `YYYY-MM` values fall back to the current Malaysia month.
- Invalid member counts produce a per-team setup exception.
- Missing salary amount or commission rule produces a visible configuration error.
- Missing source-partner data blocks invoice issuance so the 25% sender share is never orphaned.
- Duplicate source keys are treated as idempotent success during generation.
- Duplicate payout attempts fail without changing data.
- Payout creation and obligation voiding are transactional and audited.
- Financial history is never deleted to correct a payout.

## Testing and Verification

Automated tests must cover:

- RM 2,000 salary allocation into two RM 1,000 obligations.
- RM 560 commission allocation into RM 168, RM 168, RM 140, and RM 84.
- Discounted subtotal commission basis with tax excluded.
- Invalid member counts.
- Salary source-key uniqueness.
- Commission source-key uniqueness.
- Idempotent month generation.
- Invoice issuance creates `CommissionEntry` and member obligations atomically.
- Full-payment-only settlement.
- Duplicate payout prevention.
- Data Entry permission and rejection of all other roles.
- CEO reporting contains aggregates but no mutation controls.
- Team creation requires two distinct members.

Release verification requires:

- Prisma client generation and migration validation.
- Full test suite.
- ESLint.
- TypeScript typecheck.
- Browser verification of salary generation, commission creation after invoice issuance, a full payout, duplicate prevention, and CEO read-only aggregates.

## Documentation Impact

`Plan.md` is updated to move confirmed fixed team salaries and commission payouts into the active implementation scope. Payroll features outside this specification remain future work.
