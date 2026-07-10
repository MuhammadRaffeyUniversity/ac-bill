# Workbook Migration Mapping

## Purpose and boundary

`EZY Aircond.xlsx` is a historical reporting source, not an import-ready database.
Use this document and `scripts/workbook-import-dry-run.ts` to validate a **redacted JSON snapshot** before any database import is written. The dry run is read-only: it does not open the Excel workbook, contact Neon, or create/update Prisma records.

Do not use workbook totals to overwrite transaction records already created in AC Bill. The first migration should load only a confirmed date range, retain source-row references in an import log, and be run in a non-production database first.

## Sheet-to-model mapping

| Workbook sheet | Intended destination | Import treatment |
| --- | --- | --- |
| `Dash Board` | CEO reports / reconciliation targets | Do not create transactions from summary cells. Use totals only to compare the imported period. |
| `Invoice Record` | Job-count and dispatch reporting | Do not create `Invoice` rows. It contains aggregate team counts, not customer invoices. |
| `Salary Teams` | `CommissionEntry`, `TeamExpense`, reporting | Validate team, date, sales, cash/sent and expense fields. Create ledger/report entries only after matching an imported job or recording an explicit historical adjustment. |
| `Commission Teams` | `CommissionEntry`, reporting | Validate team, date and sales. Calculate shares from the confirmed effective `CommissionRule`; do not trust copied share columns as authoritative. |
| `Personal Expenses` | `PersonalExpense` | Import separately from company costs. It must not silently reduce company profit. |
| `Company Expenses` | `CompanyExpense` | Map date, category, description, amount, payment method and notes when available. |
| `Employee Records` | `EmployeeRecord`, optional `TeamExpense` | Requires manual confirmation of member identity, team and whether gas is an expense, reimbursement, or commission. |
| `Petty Cash` | `PettyCashEntry` | Map cash in/out and source reference. Recalculate running balance and flag discrepancies rather than trusting it blindly. |
| `Sheet11` | None | Ignore; it is empty. |
| `Sheet12` | None | Exclude; it is sample AI expense categorization, not AC operational data. |

## Required cleanup before import

1. Confirm the final six active teams: five salary and one commission team.
2. Build an alias table for historical names such as `Nilai` and `Nilai Team`; never merge them automatically merely because their text looks similar.
3. Confirm the source sender/partner for historical rows before creating any commission entry.
4. Agree whether sender commission is calculated before or after discounts for the imported period.
5. Resolve employee-record gas fields before classifying them as expenses or earnings.
6. Exclude any row with missing date, amount/sales, or a team identity that cannot be matched to a confirmed team.

## Redacted snapshot format

Create a local JSON file outside source control. Use only the sheets and columns needed for the dry run. Column names may use the displayed capitalization shown below.

```json
{
  "sheets": {
    "Salary Teams": [{ "Team": "Confirmed team name", "Sales": 510, "Expense": 115 }],
    "Commission Teams": [{ "Team": "Confirmed team name", "Sales": 560 }],
    "Company Expenses": [{ "Amount": 40 }],
    "Personal Expenses": [{ "Amount": 25 }],
    "Petty Cash": [{ "Cash In": 100, "Cash Out": 20 }]
  }
}
```

Run the dry run with:

```powershell
pnpm exec tsx scripts/workbook-import-dry-run.ts C:\path\to\redacted-workbook-snapshot.json
```

The result lists row counts, source team names requiring a manual mapping, source totals, and warnings. Any `error` means the snapshot is unsuitable for import. Warnings must be resolved or explicitly approved in the migration record.

## Validation totals

For the same date range, retain these comparisons in the migration record:

| Check | Source | Target | Acceptance rule |
| --- | --- | --- | --- |
| Salary-team sales | `Salary Teams` total sales | imported salary sales | Exact to two decimal places after approved corrections. |
| Salary-team expenses | `Salary Teams` total expense | approved imported team expenses | Exact to two decimal places; rejected/unapproved items stay separate. |
| Commission-team sales | `Commission Teams` total sales | imported commission sales | Exact to two decimal places. |
| Company expenses | `Company Expenses` total amount | imported company expenses | Exact to two decimal places. |
| Personal expenses | `Personal Expenses` total amount | imported personal expenses | Exact to two decimal places and reported separately. |
| Petty cash | cash in minus cash out | recalculated ledger balance | Must match opening balance plus imported movement. |
| Dashboard profit | `Dash Board` summary | database report | Explain differences caused by workbook formulas, especially visible dashboard profit that may omit expenses. |

## Explicit unknowns

- The external workbook may have dates stored as Excel serial numbers, formatted strings, or blanks; normalize and review them in the later workbook-reader stage.
- Workbook rows do not establish reliable customer-level invoice identities, payment allocation, or job ownership. Do not synthesize customer invoices from aggregate rows.
- Historical team name variants cannot be resolved safely without business confirmation.
- The import must not seed fictional teams or rates. Confirmed configuration in the application is the source of truth.
