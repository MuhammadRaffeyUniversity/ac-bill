# AC Company Operations Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private operations site for an AC service company to convert WhatsApp job messages into structured jobs, assign the nearest available team, track job completion, payments, commissions, expenses, invoices, feedback, daily profit, and daily earnings reconciliation against balance received.

**Architecture:** Use the existing Next.js App Router project as the app shell. Store all business records in a relational database with explicit tables for jobs, customers, teams, invoices, payments, commissions, expenses, and feedback. Keep financial calculations in server-side typed functions with tests so the site can replace the current Excel workbook without losing the business logic.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Neon PostgreSQL, Prisma, Zod, Auth.js credentials auth with database-backed roles, server actions or route handlers, xAI Grok 4.3 Latest structured JSON extraction for initial customer-job WhatsApp intake only, and customer-ready PDF invoices in the first release.

---

## Workbook Findings

Source workbook inspected: `C:\Users\Raffey\Downloads\EZY Aircond.xlsx`.

The workbook currently acts as the company's database and daily report:

- `Dash Board`: daily summary with date, commission-team profit, salary-team profit, expenses, net profit, and account balance. Current `Net Profit` formula is `Commission Team + Salary Team`; expenses are tracked nearby but not subtracted in the visible formula.
- `Invoice Record`: daily team job counts: team, member, today's jobs, completed jobs, cancelled jobs, and remarks. This sheet does not contain customer-level invoice details yet.
- `Salary Teams`: revenue for salary-based teams. Columns include date, team, member, sales, in-cash, sent, expense detail, expense, sender 25% share, and company profit.
- `Commission Teams`: revenue split for commission teams. Current columns are sales, team 60%, partner 25%, and company profit 15%.
- `Personal Expenses`: CEO/personal expenses with date and amount.
- `Company Expenses`: company expenses such as team rent with category, description, and amount.
- `Employee Records`: per-employee sales/cash/sent/expense records plus gas/commission-style records.
- `Petty Cash`: intended cash ledger with date, cash in, cash out, and balance.
- `Sheet11`: empty.
- `Sheet12`: sample AI expense categorization table, not part of the core AC workflow.

Current teams observed in the workbook include `Jb 1`, `Jb 2`, `2 Jb`, `Melaka 1`, `Melaka 2`, `Nilai`, `Nilai Team`, and `Ali & Zeeshan`. These workbook labels include variants and are not the active roster; implementation should seed only confirmed teams rather than blindly importing every variant.

## Product Scope

Build an internal dashboard, not a public marketing site.

Core users:

- CEO/admin: Ali is the CEO/operator receiving outsourced WhatsApp jobs from a Malaysian company; his only internal screen is the read-only dashboard. It contains the financial pulse, jobs requiring attention, and operational reporting. Record creation, updates, approval, and all other operational entry actions live in role-specific operator views.
- Dispatcher/operator: pastes WhatsApp job messages, reviews extracted fields, assigns teams, updates status, and can enter team updates received through WhatsApp.
- Data-entry operator: records team-submitted WhatsApp updates on behalf of teams, including job completion, payments, expenses, notes, and corrections.
- Team lead: sees assigned jobs, updates completion, records payments, expenses, photos/notes if added later.
- Job sender/partner: receives calculated 25% commission reporting, not necessarily full system access in MVP.
- Customer: only uses public invoice and feedback links.

## Key Business Rules

- Every WhatsApp job must become a structured `Job` after human review.
- The LLM can extract and suggest fields, but the app must show the parsed result for confirmation before saving.
- Each job has one customer, one service address, one or more AC units, one source sender/partner, one assigned team, one status, and one invoice.
- Customer payment can be cash, online transfer, card/other, or split across multiple methods.
- Cash collected by a team and money sent online must be tracked separately.
- Finance must track employee daily expenses, salary plus commission amounts, company commission/share, and daily earnings matched against balance received.
- WhatsApp job sender commission defaults to 25% of job sales. This 25% belongs to the sender/outsourcing partner that provides the WhatsApp client, not to Ali personally.
- Commission teams default to 60% team share, 25% sender share, and 15% company share.
- Salary teams default to no team revenue commission; company profit is sales minus sender commission and approved team expenses.
- Each salary team has a fixed RM 2,000 monthly salary obligation, split into RM 1,000 for each of its two active members.
- Commission-team obligations are created when an invoice is issued. The 60% team share is split equally between its two active members, so each member receives 30% of commissionable sales.
- Commissionable sales are the invoice subtotal after discount and before tax.
- Salary and commission payouts are full-payment only. Data Entry records payouts; the CEO sees read-only aggregate payout reporting on the existing dashboard.
- The current confirmed roster has four active teams: salary-based `JB Team 1`, `JB Team 2`, and `Melaka Team 1`, plus commission-based `Ali & Zeeshan`. Data Entry can add more teams of either compensation type as operations require.
- The assigned team must perform the job before final invoicing.
- A job cannot be marked fully complete until payment collection is recorded as cash, online/account, split payment, unpaid, or cancelled/no-charge.
- Teams may send job updates and daily entries through WhatsApp instead of logging into the system.
- A data-entry operator must be able to enter team-submitted WhatsApp updates on behalf of any team, while preserving who submitted the update and who entered it.
- Team completion updates (for example, "done, RM 75") are entered manually by the data-entry operator. Do not use AI to parse, infer, calculate, or save these updates; keep the raw WhatsApp text as an audit record.
- After the data-entry operator confirms the completed work, amount, and payment details, they create the customer invoice PDF and send the customer review request.
- Team expense examples include petrol, car wash, parking, Touch 'n Go, gas, and job supplies.
- Company expense examples include team rent and other operating expenses.
- Personal expenses are tracked separately from company expenses and should not silently reduce company profit unless the dashboard explicitly includes a personal-withdrawal view.
- Invoices must be generated as customer-ready PDFs after manual completion confirmation. They must include the company details, invoice number/date, bill-to address, service line items, totals, and approved warranty/terms from the supplied invoice sample.
- Customer feedback links must be tokenized and public, without exposing internal records.
- The customer review request must cover the supplied review sample's verification fields: total paid amount, payment method, technician rating, and whether the AC is cooling properly.
- Dashboard reports must support daily, weekly, monthly, and yearly views.
- Daily, weekly, monthly, and yearly financial reporting is presented within the CEO dashboard and must not be visible to dispatchers, team leads, partners, or customers.

## Data Model

Create these tables through Prisma migrations.

### Users and Access

- `User`: admin, dispatcher, team lead, or viewer.
- `Team`: name, region, compensation type, active flag, default members, optional latitude/longitude, service area tags.
- `TeamMember`: name, phone, team, role, active flag.
- `Partner`: WhatsApp job sender name, phone, default commission rate.

### Customer and Job Intake

- `Customer`: name, phone, normalized phone, notes.
- `ServiceAddress`: customer, raw address, street, area/taman, postcode, city, state, country, latitude, longitude.
- `Job`: customer, address, source partner, requested date/time, service type, units count, status, priority, raw WhatsApp text, extraction confidence, assigned team, scheduled window, completion time, cancellation reason, remarks.
- `JobUnit`: job, unit label, AC type, horsepower, issue, action performed, unit price.
- `JobStatusHistory`: job, previous status, next status, actor, note, timestamp.
- `TeamSubmittedEntry`: team, submitted by team member, entered by operator, related job, raw WhatsApp text, entry type, manually entered fields, entry date, review status, notes. Team updates are never AI-parsed.

### Money and Invoices

- `Invoice`: job, invoice number, status, subtotal, discount, tax, total, issued at, due at, printable token.
- `InvoiceItem`: invoice, description, quantity, unit price, line total.
- `Payment`: invoice, method, amount, collected by team flag, reference number, received at, notes.
- `TeamExpense`: job or team, date, category, description, amount, paid by, approved flag.
- `CompanyExpense`: date, category, description, amount, payment method, notes.
- `PersonalExpense`: date, amount, category, description, notes.
- `PettyCashEntry`: date, cash in, cash out, balance after entry, source type, source id, note.
- `PayoutObligation`: salary or commission amount owed to one team member, source month or invoice, amount, status, and unique source key.
- `Payout`: one full settlement of one payout obligation, including payment method, reference, paid date, and recording operator.

### Profit and Feedback

- `CommissionRule`: team compensation type, team rate, partner rate, company rate, effective date range.
- `CommissionEntry`: job or invoice, team, partner, sales amount, team amount, partner amount, company amount, expense amount, net company profit.
- `Feedback`: job, customer, token, rating, comment, submitted at, public display permission.
- `AuditLog`: actor, entity type, entity id, action, before JSON, after JSON, created at.

## Authentication and Access Control

Provider decision: use Auth.js credentials authentication for internal staff accounts. Staff users are stored in Neon through the `User` table, including role, active status, optional team assignment, and password hash. Route access is role-gated on the server:

- CEO/admin: the dashboard only. It is a read-only monitor for financials, jobs, reports, and operational exceptions; the CEO has no separate intake, dispatch, jobs, finance, expense, team-entry, or partner screen.
- Dispatcher/operator: intake, dispatch, and jobs.
- Data-entry operator: the only role permitted to perform WhatsApp intake, create reviewed jobs, and record or review team-submitted WhatsApp entries. They may also use dispatch, jobs, expenses, and the one-time team setup screen needed to register the final confirmed six teams for those operational records.
- Team lead: team mobile worklist and assigned job records only.
- Partner viewer: sender commission report only.
- Customer invoice and feedback pages remain public token routes and do not require login.

## LLM WhatsApp Extraction for Initial Customer Intake Only

Provider decision: use xAI `grok-4.3-latest` for WhatsApp parsing. The xAI API is OpenAI-compatible at `https://api.x.ai/v1`, authenticated with `XAI_API_KEY`. Keep the model name configurable through `XAI_MODEL` so the deployment can change aliases without code edits.

Build a paste-and-review intake screen for the initial customer booking message only. It does not process team completion, payment, expense, or daily-entry WhatsApp messages.

Input example:

```text
July 08, 2026 at 02:00 PM (Asia/Kuala Lumpur)

Faridah binti mat taib

"+60 19-756 3236"
Full service address...
"No 46 jln mawar 56 taman mawar pasir gudang johor"
How many aircond units?
"1"
Service, Install or Repair?
"Service"
```

Required structured output:

```json
{
  "requestedAt": "2026-07-08T14:00:00+08:00",
  "timezone": "Asia/Kuala_Lumpur",
  "customerName": "Faridah binti mat taib",
  "phone": "+60197563236",
  "rawPhone": "+60 19-756 3236",
  "rawAddress": "No 46 jln mawar 56 taman mawar pasir gudang johor",
  "postcode": null,
  "cityOrArea": "Pasir Gudang",
  "state": "Johor",
  "unitsCount": 1,
  "serviceType": "SERVICE",
  "missingFields": ["postcode"],
  "confidence": 0.92
}
```

Validation rules:

- `customerName`, `phone`, `rawAddress`, `unitsCount`, and `serviceType` are required before saving.
- Normalize Malaysian phone numbers to E.164 where possible.
- Preserve the raw WhatsApp text on the job forever for audit.
- Never let the LLM calculate money silently. Money is entered or selected by the operator/team and calculated by deterministic code.
- If the LLM cannot confidently parse a field, save the field as empty and show it in `missingFields`.
- Never send a team-submitted completion update through the LLM. The data-entry operator transcribes its outcome manually, then reviews it before it affects the job, payment, invoice, or finance records.

## Main Screens

### Confirmed Unified Data-Entry Flow

The data-entry interface uses one guided `Job flow` workspace instead of separate Intake, Dispatch, Jobs, Team updates, and Invoices destinations. The operator selects a job from an action queue and completes only its current persisted stage: WhatsApp booking, team assignment, manual team report and closeout, invoice, then customer handoff with PDF and feedback link. Supporting screens such as Expenses and Teams remain separate because they are not stages of a job.

The unified workspace must support the existing light and dark themes through semantic shadcn tokens. On mobile, it becomes a queue-first flow where selecting a job opens the current stage as a full screen rather than compressing desktop columns.

The interface uses a shared subtle operational motion system across sign-in, Data Entry, CEO, supporting staff, and public customer screens. Motion stays between 120–220ms, uses small fade/lift transitions and restrained record staggering, never delays authentication or financial actions, and is disabled when the user prefers reduced motion. Responsive QA covers 320, 360, 768, 1024, and 1440 pixel widths while preserving the mobile queue-first workflow and desktop sidebars.

### Dashboard

- CEO-only access for daily, weekly, monthly, and yearly reports.
- Today's jobs: total, assigned, completed, cancelled, postponed.
- Revenue: salary-team sales, commission-team sales, online payments, cash collected.
- Profit: salary-team profit, commission-team profit, approved team expenses, company expenses, personal expenses shown separately.
- Reconciliation: employee daily expenses, salary plus commission, company commission/share, daily earnings, balance received, and any mismatch.
- Team cards: active jobs, completed jobs, cash held, amount sent, expenses, net.
- Alerts: unassigned jobs, unpaid invoices, missing feedback, unapproved expenses.

### Job Intake Stage

- Paste WhatsApp message.
- Run LLM extraction.
- Review/edit structured fields.
- Choose source partner/job sender.
- Suggest nearest team using address area/postcode and team service areas.
- Save job as `BOOKED` or directly assign as `ASSIGNED`.

### Team Assignment Stage

- Columns by status: booked, assigned, in progress, completed, cancelled/postponed.
- Filter by date, team, region, service type, payment status.
- Assignment modal with team availability and service area hints.

### Job Flow Detail Workspace

- Customer details, address, raw message, parsed fields.
- Team assignment and status history.
- Units and service line items.
- Job closeout: performed/not performed, completion notes, and required payment status.
- Payments: cash, online, split payments.
- Expenses tied to the job.
- Manually transcribed team-submitted WhatsApp updates, including raw message text and entered-by audit details; this flow must not call an LLM.
- Invoice PDF preview/download after manual completion confirmation.
- Customer review request generator with the supplied payment, technician-rating, and AC-cooling checks.

### Finance

- CEO-only daily, weekly, monthly, and yearly reports matching the workbook-style dashboard.
- Salary team report.
- Commission team report.
- Partner/job sender commission report.
- Employee daily expense, salary plus commission, company commission/share, and daily earnings versus balance received report.
- Employee/team member records.
- Data-entry view for team-submitted WhatsApp daily entries.
- Data-entry payout workspace for monthly salary obligations and invoice-triggered commission obligations.
- Company expenses.
- Personal expenses.
- Petty cash ledger.

### Invoice and Feedback Stages

- Internal invoice editor.
- Invoice creation after a data-entry operator manually confirms service/job completion, amount, and payment details from the team's WhatsApp update.
- Customer-ready invoice PDF using the supplied EZY Aircon invoice layout and warranty terms.
- Public feedback form using a secure token, with the supplied review verification fields.
- Feedback results visible inside job detail and dashboard.

## Team Assignment Logic

MVP assignment should be deterministic and reviewable:

1. Parse area, city, state, and postcode from the address.
2. Match against each team's service area tags, for example `Johor Bahru`, `Pasir Gudang`, `Melaka`, `Nilai`.
3. Prefer active teams with fewer assigned jobs for the same day.
4. Show the top suggested team with a reason.
5. Let the dispatcher override and record the override reason.

Later enhancement:

- Add geocoding and store latitude/longitude for teams and addresses.
- Rank by actual distance and estimated travel time.

## Financial Calculation Rules

Create pure functions for all calculations and test them with examples from the workbook.

Commission team example:

```ts
sales = 560
teamShare = sales * 0.60      // 336
partnerShare = sales * 0.25   // 140
companyShare = sales * 0.15   // 84
```

Salary team example:

```ts
sales = 510
senderShare = sales * 0.25    // 127.50
approvedExpenses = 115
companyProfit = sales - senderShare - approvedExpenses // 267.50
```

Confirmed business setup:

```ts
activeTeams = 6
salaryTeams = 5
commissionTeams = 1
whatsAppSenderCommissionRate = 0.25
```

Payment reconciliation:

```ts
invoiceTotal = sum(invoiceItems)
paidTotal = sum(payments)
balanceDue = invoiceTotal - paidTotal
cashHeldByTeam = sum(cash payments where collectedByTeam = true) - cash deposited
onlineReceived = sum(online payments)
dailyEarnings = salaryTeamProfit + commissionTeamCompanyShare
balanceReceived = onlineReceived + depositedCash
reconciliationDifference = dailyEarnings - balanceReceived
```

Job closeout requirement:

```ts
canCloseJob =
  jobPerformed === true &&
  invoiceCreatedAfterService === true &&
  paymentStatus in ["PAID", "PARTIALLY_PAID", "UNPAID", "NO_CHARGE"]
```

## Implementation Tasks

### Task 1: Project Foundation

**Files:**

- Modify: `package.json`
- Create: `prisma/schema.prisma`
- Create: `.env.example`
- Create: `src/lib/env.ts`
- Create: `src/lib/db.ts`

- [x] Add dependencies: `prisma`, `@prisma/client`, `zod`, and the selected auth package.
- [x] Add scripts: `db:generate`, `db:migrate`, `db:studio`, `typecheck`.
- [ ] Create environment validation for Neon database URL and xAI API settings.
- [x] Create Prisma client wrapper.
- [x] Run `pnpm lint` and `pnpm typecheck`.

### Task 2: Database Schema

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `prisma/seed.ts`

- [x] Add models listed in the Data Model section.
- [x] Add enum types for job status, service type, payment method, compensation type, user role, and invoice status.
- [ ] Seed the four confirmed teams, default commission rules, and initial admin user.
- [ ] Allow Data Entry to add additional salary or commission teams; the final roster remains open.
- [ ] Run a migration and verify Prisma Studio opens.

### Task 3: Calculation Engine

**Files:**

- Create: `src/lib/finance/calculations.ts`
- Create: `src/lib/finance/calculations.test.ts`

- [x] Implement commission-team split.
- [x] Implement salary-team company profit.
- [x] Implement invoice balance and payment reconciliation.
- [x] Implement a closeout guard that requires job performance status and payment status before a job is fully completed.
- [x] Add tests using workbook examples: `560 -> 336/140/84` and `510, 115 -> 267.50`.
- [x] Run the finance tests before connecting calculations to UI.

### Task 4: WhatsApp Intake Parser

**Files:**

- Create: `src/lib/intake/schema.ts`
- Create: `src/lib/intake/parse-whatsapp-message.ts`
- Create: `app/jobs/intake/page.tsx`
- Create: `app/api/intake/parse/route.ts`

- [x] Define the structured output schema with Zod.
- [x] Call the LLM with a strict JSON schema.
- [ ] Normalize phone, date/time, service type, and unit count.
- [x] Return missing fields and confidence.
- [x] Show parsed output in a human-editable review form.

### Task 5: Job and Dispatch Workflow

**Files:**

- Create: `app/jobs/page.tsx`
- Create: `app/jobs/[jobId]/page.tsx`
- Create: `app/dispatch/page.tsx`
- Create: `app/team-entries/page.tsx`
- Create: `src/lib/jobs/actions.ts`
- Create: `src/lib/dispatch/team-suggestion.ts`
- Create: `src/lib/team-entries/actions.ts`

- [x] Save reviewed intake as a job.
- [x] Add status transitions with history.
- [x] Add a job closeout step for performed/not performed, completion notes, and payment status.
- [x] Add a data-entry screen where operators can enter team-submitted WhatsApp updates for job completion, payments, expenses, and notes.
- [x] Store raw team WhatsApp update text, submitting team/member, entered-by operator, related job, and review status.
- [x] Suggest teams by service area and workload.
- [x] Allow manual assignment override.
- [x] Add filters by date, team, status, and service type.

### Task 6: Invoices, Payments, and Feedback

**Files:**

- Create: `app/invoices/[invoiceId]/page.tsx`
- Create: `app/invoice/[token]/page.tsx`
- Create: `app/feedback/[token]/page.tsx`
- Create: `src/lib/invoices/actions.ts`
- Create: `src/lib/feedback/actions.ts`

- [x] Generate invoice numbers.
- [x] Allow invoice creation only after service/job completion is confirmed, except for admin correction flows.
- [x] Add invoice line items from job units and manual charges.
- [x] Add cash, online, and split payments.
- [x] Generate a customer-ready invoice PDF matching the approved EZY Aircon sample layout and warranty/terms.
- [x] Generate a customer review request with total-paid, payment-method, technician-rating, and AC-cooling fields from the approved sample.
- [x] Save the submitted review verification and feedback fields from the public customer form.

### Task 7: Finance and Reports

**Files:**

- Create: `app/finance/page.tsx`
- Create: `app/finance/teams/page.tsx`
- Create: `app/finance/expenses/page.tsx`
- Create: `app/finance/petty-cash/page.tsx`
- Create: `src/lib/reports/daily-report.ts`

- [x] Recreate the workbook daily dashboard with database-backed values.
- [ ] Add CEO-only report period controls for daily, weekly, monthly, and yearly views.
- [ ] Add salary-team and commission-team report views.
- [ ] Add partner/job sender commission report.
- [ ] Add employee daily expense, salary plus commission, company commission/share, and daily earnings versus balance received reconciliation.
- [ ] Add automatic RM 2,000 monthly salary obligations per salary team, split RM 1,000 per active member.
- [ ] Add commission-team payout obligations at invoice issuance, split equally between the two active team members.
- [ ] Add full-payment-only payout recording, audit history, and CEO read-only payout aggregates.
- [x] Add company and personal expense entry forms.
- [x] Add petty cash ledger.
- [ ] Verify report totals against a small imported sample from the workbook.

### Task 8: Excel Migration Helper

**Files:**

- Create: `scripts/analyze-ezy-aircond-workbook.ts`
- Create: `scripts/import-ezy-aircond-sample.ts`
- Create: `docs/workbook-mapping.md`

- [x] Document how each workbook sheet maps to database tables.
- [ ] Import a limited sample from July 2026 for validation.
- [x] Do not import `Sheet12` as operational data.
- [x] Flag team-name variants for manual cleanup.
- [ ] Compare dashboard totals after import.

### Task 9: Authentication and Permissions

**Files:**

- Create: `src/lib/auth/permissions.ts`
- Modify: protected app routes.

- [ ] Restrict finance and expenses to admin/CEO users.
- [ ] Restrict daily, weekly, monthly, and yearly dashboard reports to admin/CEO users only.
- [ ] Allow dispatchers to create and assign jobs.
- [x] Allow data-entry operators to enter team-submitted WhatsApp updates for any team without granting CEO-only report access.
- [x] Allow team leads to update only their assigned jobs.
- [x] Keep invoice and feedback token routes public but read-limited.

### Task 10: QA and Release

**Files:**

- Modify: `README.md`
- Create: `docs/manual-test-checklist.md`

- [ ] Add setup instructions.
- [x] Add manual test cases for intake, assignment, completion, payment split, invoice print, feedback, and daily report.
- [x] Run `pnpm lint`.
- [x] Run `pnpm typecheck`.
- [ ] Run the app locally and test the main flows in a browser.

## Open Decisions To Confirm Before Implementation

- Final roster beyond the four confirmed teams, including names, compensation types, and regions/service areas for any future additions.
- Whether the WhatsApp sender's 25% commission applies before or after discounts.
- Whether gas charges are job expenses, employee commissions, or pass-through reimbursements.
- Whether personal expenses should appear on the main profit dashboard or only in a separate owner view.
- Whether customer feedback should be anonymous to teams or visible on job detail.
- Whether the first deployment target is Vercel plus managed Postgres, or another host.

## First Build Recommendation

Start with a narrow MVP:

1. WhatsApp paste-to-job intake.
2. Manual team assignment with smart suggestions.
3. Job completion, invoice, and split payments.
4. Deterministic commission/profit calculations.
5. Daily dashboard matching the Excel workbook.

This gets the business out of manual sheet entry quickly while leaving advanced maps, automated WhatsApp ingestion, photo uploads, and payroll beyond the confirmed fixed team salaries and commission payouts for later releases.
