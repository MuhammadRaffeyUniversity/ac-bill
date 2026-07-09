# AC Company Operations Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private operations site for an AC service company to convert WhatsApp job messages into structured jobs, assign the nearest available team, track job completion, payments, commissions, expenses, invoices, feedback, daily profit, and daily earnings reconciliation against balance received.

**Architecture:** Use the existing Next.js App Router project as the app shell. Store all business records in a relational database with explicit tables for jobs, customers, teams, invoices, payments, commissions, expenses, and feedback. Keep financial calculations in server-side typed functions with tests so the site can replace the current Excel workbook without losing the business logic.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, PostgreSQL, Prisma, Zod, server actions or route handlers, OpenAI structured outputs for WhatsApp parsing, and HTML print views for invoices in the first release.

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

Current teams observed in the workbook include `Jb 1`, `Jb 2`, `2 Jb`, `Melaka 1`, `Melaka 2`, `Nilai`, `Nilai Team`, and `Ali & Zeeshan`. The business has 6 active teams total: 5 salary teams and 1 commission team. Implementation should seed teams from the final confirmed team list rather than blindly importing every workbook variant.

## Product Scope

Build an internal dashboard, not a public marketing site.

Core users:

- CEO/admin: Ali is the CEO/operator receiving outsourced WhatsApp jobs from a Malaysian company; he sees all financials, expenses, reports, invoices, feedback, and team performance.
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
- There are 6 total active teams in the current business setup: 5 salary teams and 1 commission team.
- The assigned team must perform the job before final invoicing.
- A job cannot be marked fully complete until payment collection is recorded as cash, online/account, split payment, unpaid, or cancelled/no-charge.
- Teams may send job updates and daily entries through WhatsApp instead of logging into the system.
- A data-entry operator must be able to enter team-submitted WhatsApp updates on behalf of any team, while preserving who submitted the update and who entered it.
- Team expense examples include petrol, car wash, parking, Touch 'n Go, gas, and job supplies.
- Company expense examples include team rent and other operating expenses.
- Personal expenses are tracked separately from company expenses and should not silently reduce company profit unless the dashboard explicitly includes a personal-withdrawal view.
- Invoices must support print from the browser in MVP.
- Customer feedback links must be tokenized and public, without exposing internal records.
- Dashboard reports must support daily, weekly, monthly, and yearly views.
- Daily, weekly, monthly, and yearly financial/reporting dashboards are CEO-only and must not be visible to dispatchers, team leads, partners, or customers.

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
- `TeamSubmittedEntry`: team, submitted by team member, entered by operator, related job, raw WhatsApp text, entry type, parsed fields, entry date, review status, notes.

### Money and Invoices

- `Invoice`: job, invoice number, status, subtotal, discount, tax, total, issued at, due at, printable token.
- `InvoiceItem`: invoice, description, quantity, unit price, line total.
- `Payment`: invoice, method, amount, collected by team flag, reference number, received at, notes.
- `TeamExpense`: job or team, date, category, description, amount, paid by, approved flag.
- `CompanyExpense`: date, category, description, amount, payment method, notes.
- `PersonalExpense`: date, amount, category, description, notes.
- `PettyCashEntry`: date, cash in, cash out, balance after entry, source type, source id, note.

### Profit and Feedback

- `CommissionRule`: team compensation type, team rate, partner rate, company rate, effective date range.
- `CommissionEntry`: job or invoice, team, partner, sales amount, team amount, partner amount, company amount, expense amount, net company profit.
- `Feedback`: job, customer, token, rating, comment, submitted at, public display permission.
- `AuditLog`: actor, entity type, entity id, action, before JSON, after JSON, created at.

## LLM WhatsApp Extraction

Build a paste-and-review intake screen.

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

## Main Screens

### Dashboard

- CEO-only access for daily, weekly, monthly, and yearly reports.
- Today's jobs: total, assigned, completed, cancelled, postponed.
- Revenue: salary-team sales, commission-team sales, online payments, cash collected.
- Profit: salary-team profit, commission-team profit, approved team expenses, company expenses, personal expenses shown separately.
- Reconciliation: employee daily expenses, salary plus commission, company commission/share, daily earnings, balance received, and any mismatch.
- Team cards: active jobs, completed jobs, cash held, amount sent, expenses, net.
- Alerts: unassigned jobs, unpaid invoices, missing feedback, unapproved expenses.

### Job Intake

- Paste WhatsApp message.
- Run LLM extraction.
- Review/edit structured fields.
- Choose source partner/job sender.
- Suggest nearest team using address area/postcode and team service areas.
- Save job as `BOOKED` or directly assign as `ASSIGNED`.

### Dispatch Board

- Columns by status: booked, assigned, in progress, completed, cancelled/postponed.
- Filter by date, team, region, service type, payment status.
- Assignment modal with team availability and service area hints.

### Job Detail

- Customer details, address, raw message, parsed fields.
- Team assignment and status history.
- Units and service line items.
- Job closeout: performed/not performed, completion notes, and required payment status.
- Payments: cash, online, split payments.
- Expenses tied to the job.
- Team-submitted WhatsApp updates entered by the operator, including raw message text and entered-by audit details.
- Invoice preview and print button.
- Feedback link generator.

### Finance

- CEO-only daily, weekly, monthly, and yearly reports matching the workbook-style dashboard.
- Salary team report.
- Commission team report.
- Partner/job sender commission report.
- Employee daily expense, salary plus commission, company commission/share, and daily earnings versus balance received report.
- Employee/team member records.
- Data-entry view for team-submitted WhatsApp daily entries.
- Company expenses.
- Personal expenses.
- Petty cash ledger.

### Invoice and Feedback

- Internal invoice editor.
- Invoice creation after service/job completion confirmation.
- Public printable invoice route using a secure token.
- Public feedback form using a secure token.
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

- [ ] Add dependencies: `prisma`, `@prisma/client`, `zod`, and the selected auth package.
- [ ] Add scripts: `db:generate`, `db:migrate`, `db:studio`, `typecheck`.
- [ ] Create environment validation for database URL and OpenAI API key.
- [ ] Create Prisma client wrapper.
- [ ] Run `pnpm lint` and `pnpm typecheck`.

### Task 2: Database Schema

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `prisma/seed.ts`

- [ ] Add models listed in the Data Model section.
- [ ] Add enum types for job status, service type, payment method, compensation type, user role, and invoice status.
- [ ] Seed the confirmed 6 active teams, default commission rules, and initial admin user.
- [ ] Mark exactly 5 seeded teams as salary teams and 1 seeded team as commission-based after the final team names are confirmed.
- [ ] Run a migration and verify Prisma Studio opens.

### Task 3: Calculation Engine

**Files:**

- Create: `src/lib/finance/calculations.ts`
- Create: `src/lib/finance/calculations.test.ts`

- [ ] Implement commission-team split.
- [ ] Implement salary-team company profit.
- [ ] Implement invoice balance and payment reconciliation.
- [ ] Implement a closeout guard that requires job performance status and payment status before a job is fully completed.
- [ ] Add tests using workbook examples: `560 -> 336/140/84` and `510, 115 -> 267.50`.
- [ ] Run the finance tests before connecting calculations to UI.

### Task 4: WhatsApp Intake Parser

**Files:**

- Create: `src/lib/intake/schema.ts`
- Create: `src/lib/intake/parse-whatsapp-message.ts`
- Create: `app/jobs/intake/page.tsx`
- Create: `app/api/intake/parse/route.ts`

- [ ] Define the structured output schema with Zod.
- [ ] Call the LLM with a strict JSON schema.
- [ ] Normalize phone, date/time, service type, and unit count.
- [ ] Return missing fields and confidence.
- [ ] Show parsed output in a human-editable review form.

### Task 5: Job and Dispatch Workflow

**Files:**

- Create: `app/jobs/page.tsx`
- Create: `app/jobs/[jobId]/page.tsx`
- Create: `app/dispatch/page.tsx`
- Create: `app/team-entries/page.tsx`
- Create: `src/lib/jobs/actions.ts`
- Create: `src/lib/dispatch/team-suggestion.ts`
- Create: `src/lib/team-entries/actions.ts`

- [ ] Save reviewed intake as a job.
- [ ] Add status transitions with history.
- [ ] Add a job closeout step for performed/not performed, completion notes, and payment status.
- [ ] Add a data-entry screen where operators can enter team-submitted WhatsApp updates for job completion, payments, expenses, and notes.
- [ ] Store raw team WhatsApp update text, submitting team/member, entered-by operator, related job, and review status.
- [ ] Suggest teams by service area and workload.
- [ ] Allow manual assignment override.
- [ ] Add filters by date, team, status, and service type.

### Task 6: Invoices, Payments, and Feedback

**Files:**

- Create: `app/invoices/[invoiceId]/page.tsx`
- Create: `app/i/[token]/page.tsx`
- Create: `app/f/[token]/page.tsx`
- Create: `src/lib/invoices/actions.ts`
- Create: `src/lib/feedback/actions.ts`

- [ ] Generate invoice numbers.
- [ ] Allow invoice creation only after service/job completion is confirmed, except for admin correction flows.
- [ ] Add invoice line items from job units and manual charges.
- [ ] Add cash, online, and split payments.
- [ ] Build a print-friendly invoice page.
- [ ] Generate public feedback links.
- [ ] Save customer rating/comment from public feedback form.

### Task 7: Finance and Reports

**Files:**

- Create: `app/finance/page.tsx`
- Create: `app/finance/teams/page.tsx`
- Create: `app/finance/expenses/page.tsx`
- Create: `app/finance/petty-cash/page.tsx`
- Create: `src/lib/reports/daily-report.ts`

- [ ] Recreate the workbook daily dashboard with database-backed values.
- [ ] Add CEO-only report period controls for daily, weekly, monthly, and yearly views.
- [ ] Add salary-team and commission-team report views.
- [ ] Add partner/job sender commission report.
- [ ] Add employee daily expense, salary plus commission, company commission/share, and daily earnings versus balance received reconciliation.
- [ ] Add company and personal expense entry forms.
- [ ] Add petty cash ledger.
- [ ] Verify report totals against a small imported sample from the workbook.

### Task 8: Excel Migration Helper

**Files:**

- Create: `scripts/analyze-ezy-aircond-workbook.ts`
- Create: `scripts/import-ezy-aircond-sample.ts`
- Create: `docs/workbook-mapping.md`

- [ ] Document how each workbook sheet maps to database tables.
- [ ] Import a limited sample from July 2026 for validation.
- [ ] Do not import `Sheet12` as operational data.
- [ ] Flag team-name variants for manual cleanup.
- [ ] Compare dashboard totals after import.

### Task 9: Authentication and Permissions

**Files:**

- Create: `src/lib/auth/permissions.ts`
- Modify: protected app routes.

- [ ] Restrict finance and expenses to admin/CEO users.
- [ ] Restrict daily, weekly, monthly, and yearly dashboard reports to admin/CEO users only.
- [ ] Allow dispatchers to create and assign jobs.
- [ ] Allow data-entry operators to enter team-submitted WhatsApp updates for any team without granting CEO-only report access.
- [ ] Allow team leads to update only their assigned jobs.
- [ ] Keep invoice and feedback token routes public but read-limited.

### Task 10: QA and Release

**Files:**

- Modify: `README.md`
- Create: `docs/manual-test-checklist.md`

- [ ] Add setup instructions.
- [ ] Add manual test cases for intake, assignment, completion, payment split, invoice print, feedback, and daily report.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm typecheck`.
- [ ] Run the app locally and test the main flows in a browser.

## Open Decisions To Confirm Before Implementation

- Final names of the 6 active teams and their regions/service areas, with 5 salary teams and 1 commission team.
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

This gets the business out of manual sheet entry quickly while leaving advanced maps, automated WhatsApp ingestion, photo uploads, and full payroll for later releases.
