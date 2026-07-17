# CEO Company Expenses Design

## Problem and Root Cause

The CEO is intentionally restricted to the read-only dashboard, while company-expense entry belongs to Data Entry in the company ledger. The CEO dashboard currently cannot show company expenses because `getMonitoringSnapshot` does not query `CompanyExpense`, `MonitoringSnapshot` has no company-expense data, and `CeoDashboard` has no expense section.

This is a missing dashboard data path, not a route-permission failure.

## Goal

Show the CEO the selected-period company-expense total and recent company-expense records on the existing read-only dashboard.

## Data Flow

`getMonitoringSnapshot` will query company expenses using the existing dashboard period range and the expense business date:

- Aggregate the total amount for records whose `date` falls within the selected period.
- Fetch the eight most recent matching records ordered by `date` and then `createdAt`, both descending.
- Select only the fields required for monitoring: `id`, `date`, `category`, `amount`, and `paymentMethod`.

`MonitoringSnapshot` will expose:

```ts
companyExpenses: {
  total: number;
  recent: MonitoringCompanyExpense[];
};
```

`MonitoringCompanyExpense` will contain JSON-safe primitive values for display:

```ts
type MonitoringCompanyExpense = {
  id: string;
  date: string;
  category: string;
  amount: number;
  paymentMethod: string | null;
};
```

The monitoring loader will convert Prisma decimals to numbers and dates to `YYYY-MM-DD` strings before returning the snapshot.

## CEO Interface

The existing CEO dashboard will add a `Company expenses` section after the main financial metrics and before payout reporting.

The section will contain:

- A read-only period-total metric.
- A compact table of up to eight recent records with date, category, payment method, and right-aligned amount.
- An empty state when no company expenses exist in the selected period.

The section will not contain links to the Data Entry ledger, create/edit/delete controls, or ledger server actions. The CEO remains dashboard-only.

## Financial Semantics

This change displays company expenses without changing `companyProfit`. The current dashboard profit value continues to use recorded commission-entry profit. Expense subtraction or net-profit reconciliation is outside this bug fix.

Personal expenses, team expenses, and petty cash remain separate and are not added to this section.

## Error and Empty States

Database query failures retain the dashboard's existing server error behavior. A successful query with no matching records renders a clear empty state rather than hiding the section.

## Testing and Verification

A regression test will prove that:

- The monitoring loader aggregates and fetches `CompanyExpense` records.
- The typed snapshot includes the total and recent rows.
- The CEO dashboard renders the company-expense section and table fields.
- The dashboard does not import or expose `createCompanyExpense`.

Focused tests will run before the full test suite, lint, and TypeScript checks. Signed-in CEO browser verification will confirm the selected-period total, recent rows or empty state, dashboard-only navigation, and responsive rendering.

