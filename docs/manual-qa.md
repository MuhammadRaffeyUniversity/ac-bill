# Manual QA Checklist

Run the checks with a Data Entry account and a CEO account. Do not use production customer data for exploratory tests.

## Unified job-flow verification — 2026-07-13

- [x] Automated: `vitest run` passed 30 files and 91 tests, including stage resolution, queue priority, manual closeout/payment combinations, atomic invoice payments, route compatibility, responsive shell contracts, and deterministic finance examples.
- [x] Automated: ESLint, TypeScript, and the Next.js production build completed without errors or warnings.
- [x] Browser: `/signin` loaded from the local app and the theme control switched the root between light and dark modes in both directions.
- [ ] Browser: the protected `/jobs` intake → assignment → team report → invoice → customer handoff flow still needs an authenticated Data Entry session. No staff credentials were read or placed in this QA record.

## Data-entry operations

- [ ] Set up the confirmed five salary teams and one commission team, including service areas, before assigning any jobs.
- [ ] Paste a WhatsApp job message in Intake, run extraction, and confirm missing fields are visible for review.
- [ ] Edit a parsed field, choose the source partner when available, and save the reviewed job.
- [ ] Verify the job keeps the original WhatsApp message and has a `BOOKED` status-history entry.
- [ ] Assign the job to a configured team and verify the assignment/status history is visible.
- [ ] Record a team WhatsApp update with raw text, submitting team/member, related job, and operator identity; approve and reject one separate test entry.
- [ ] Close a performed job with each supported payment outcome. Verify completion is blocked while performed or payment handling is missing.
- [ ] Record a team expense and verify it appears as pending until it is approved by the intended workflow.

## Billing and customer links

- [ ] Create an invoice only after a performed service confirmation.
- [ ] Add at least two invoice items and confirm subtotal, discounts/tax (when used), total, and balance due.
- [ ] Record cash and online payments against the same invoice and verify the payment split and remaining balance.
- [ ] Open the printable invoice view and check browser print output has no internal operational data.
- [ ] Open the public invoice link in a signed-out/private browser session and confirm it exposes only the intended invoice.
- [ ] Submit a public feedback rating/comment once; verify a duplicate submission is handled safely and the job/dashboard reflects the result.

## CEO monitoring

- [ ] Sign in as CEO and verify only the read-only dashboard is available: no intake, dispatch, job-entry, expense-entry, or team-entry actions.
- [ ] Change daily, weekly, monthly, and yearly dashboard periods; confirm metrics change only according to database records.
- [ ] Verify unassigned jobs, unpaid invoices, missing feedback, and unapproved expenses appear as alerts.
- [ ] Compare salary/commission sales, company expenses, personal expenses, cash/online amounts, and reconciliation difference with a known test data set.

## Workbook migration dry run

- [ ] Build a redacted JSON snapshot for one small confirmed period; keep it outside git.
- [ ] Run `pnpm exec tsx scripts/workbook-import-dry-run.ts <snapshot.json>`.
- [ ] Resolve every error and document the decision for every team-name warning.
- [ ] Confirm `Sheet11` and `Sheet12` are excluded.
- [ ] Compare the resulting totals with the workbook source and the database report before any import is approved.

## Regression checks

- [ ] Run `pnpm test`.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm lint`.
- [ ] Test the above routes at desktop and mobile widths before release.
