# CLAUDE.md

## Operating Instructions

This repository is for an AC company operations site. The product plan is in `Plan.md`; read it before implementing features.

## Business Constraints

- The site replaces a real Excel workflow from `EZY Aircond.xlsx`.
- Jobs arrive through WhatsApp messages and must be reviewed before saving.
- Ali is the CEO/operator. The company receives outsourced WhatsApp clients from a Malaysian company, and that WhatsApp sender/partner receives the 25% sender commission.
- There are 6 active teams total: 5 salary teams and 1 commission team.
- Commission teams use a default 60% team, 25% sender, 15% company split.
- Salary-team profit should be calculated from sales minus sender commission and approved expenses unless the user confirms a different rule.
- WhatsApp job senders default to 25% commission.
- Customer payments may be cash, online, or split.
- Company expenses and CEO/personal expenses are separate ledgers.
- Invoices must be printable and are normally created after service/job completion confirmation.
- Customer feedback links must be public, tokenized, and limited to the relevant job.
- A job cannot move to fully completed until the app records whether the job was performed and how payment was handled.

## Implementation Discipline

- Use TypeScript, Zod schemas, and server-side validation.
- Keep money calculations in pure functions with tests.
- Keep LLM output schemas strict and reviewed by a human before persistence.
- Avoid broad rewrites of the Next.js scaffold unless needed for the current task.
- Preserve existing user work and do not revert unrelated files.
- Do not add speculative features such as live WhatsApp API ingestion, GPS tracking, payroll, or maps unless the user asks.

## Preferred Build Order

1. Database schema and seed data.
2. Finance calculation functions and tests.
3. WhatsApp intake parser and review UI.
4. Job creation and dispatch board.
5. Job completion, invoice, payment, and feedback flows.
6. Finance dashboards and workbook migration helper.
7. Auth and permissions hardening.

## Verification

Before claiming implementation work is complete:

- Run `pnpm lint`.
- Run the TypeScript check script if it exists.
- Run relevant tests.
- Start the app and verify the changed flow in a browser for UI work.
- For invoice or feedback work, verify both internal and public token routes.
