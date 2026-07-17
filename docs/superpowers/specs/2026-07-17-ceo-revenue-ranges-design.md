# CEO Revenue Ranges Design

## Goal

Give authorized CEO/admin users a deterministic, read-only view of billed
revenue and collected payments for the current Malaysia calendar day, the
last 7 calendar days, the last 30 calendar days, or an inclusive custom date
range.

## Scope

- Extend the existing CEO dashboard instead of adding a separate finance
  screen.
- Preserve the existing CEO-only route guard and read-only role boundary.
- Keep the existing jobs, profit, company-expense, and payout reporting
  behavior.
- Add no edit, export, ledger, or operational mutation actions.
- Store the selected range in the URL so it survives refreshes and can be
  shared.

## Financial Definitions

The dashboard shows two separate revenue measures:

- **Billed revenue:** the sum of `Invoice.total` for non-void invoices whose
  `issuedAt` falls within the selected range.
- **Payments collected:** the sum of `Payment.amount` for payments whose
  `receivedAt` falls within the selected range.

These figures must not be combined or treated as a balance. A payment may be
received in a later range than the invoice it settles.

## Period and Timezone Rules

All calendar boundaries use the business timezone,
`Asia/Kuala_Lumpur` (`UTC+08:00`).

Supported selections:

- `24h`: Malaysia midnight at the start of the current calendar day through
  the current instant. The user-facing label is `24 hr`, but its approved
  business meaning is the current calendar day rather than a rolling window.
- `7d`: Malaysia midnight six calendar days before today through the current
  instant.
- `30d`: Malaysia midnight twenty-nine calendar days before today through the
  current instant.
- `custom`: Malaysia midnight on the selected start date through Malaysia
  midnight immediately after the selected end date. Both selected dates are
  therefore included.

Server queries use a half-open interval (`gte` the start and `lt` the end)
whenever the range ends at a calendar boundary. Preset ranges that end at the
current instant also use `lt` for consistency.

The server accepts:

```text
?period=24h
?period=7d
?period=30d
?period=custom&from=2026-07-01&to=2026-07-17
```

Custom dates must be valid `YYYY-MM-DD` calendar dates and `from` must be less
than or equal to `to`. An unknown period, an incomplete custom range, an
invalid date, or a reversed range falls back safely to `24h`. The resolved
period and sanitized dates are the only values sent to the dashboard.

## Server Architecture

Create a focused pure date-range module under `src/lib/dashboard` responsible
for:

- parsing preset and custom query parameters;
- constructing Malaysia-time `Date` boundaries;
- producing a human-readable range label; and
- returning sanitized values for the UI.

The CEO page passes `period`, `from`, and `to` search parameters into this
parser, then passes the resolved selection to `getMonitoringSnapshot`.

`getMonitoringSnapshot` continues to load independent aggregates in one
parallel `Promise.all` batch. Its existing invoice and payment aggregates use
the resolved range:

- invoice aggregate filters `issuedAt` and excludes `VOID`;
- payment aggregate filters `receivedAt`.

The snapshot exposes the resulting values as `finance.billedRevenue` and
`finance.paymentsCollected`. Existing finance values that are still used by
the dashboard retain their meanings.

## CEO Interface

The period navigation at the top of the dashboard contains:

- `24 hr`
- `7 days`
- `30 days`
- `Custom`

Preset links contain only their `period` parameter. Selecting `Custom` shows a
compact GET form with `from` and `to` native date inputs and an `Apply range`
button. The form writes the custom selection back to the current CEO route.

A dedicated `Revenue` section appears directly below the range controls and
before operational job metrics. It contains two scannable cards:

- `Billed revenue`
- `Payments collected`

Each card uses the resolved date label as supporting context. The page header
also displays that label. Labels use compact Malaysia-style dates, including
the year where needed to avoid ambiguity.

On mobile, preset choices wrap and the custom form stacks. The dashboard's
existing constrained grid remains responsible for containing wide tables so
the page has no horizontal overflow.

## Error and Empty Behavior

- Invalid query input never reaches a database filter; it resolves to the
  `24h` fallback.
- A valid period with no matching invoices or payments displays `RM 0.00`.
- No client-side money calculation is introduced.
- No database or schema migration is required.

## Access Control

The existing CEO page continues to call `requireRole(["ADMIN"])` before
loading the monitoring snapshot. Revenue data is rendered only inside that
protected route. The dashboard exposes no server action or mutation control.

## Testing

Use test-driven development:

1. Add pure unit tests for `24h`, `7d`, `30d`, and inclusive custom Malaysia
   date boundaries.
2. Add invalid-input tests for unknown periods, missing dates, impossible
   dates, and reversed custom ranges.
3. Add a dashboard regression test proving billed revenue uses non-void
   invoices filtered by `issuedAt`, collected payments use `receivedAt`, and
   the custom form remains read-only.
4. Run each new test before implementation and confirm it fails for the
   missing behavior.
5. Run the focused tests after implementation, then the complete test suite,
   lint, and TypeScript checks.

Signed-in browser verification uses the supplied CEO account and covers:

- `24h`, `7d`, and `30d` preset navigation;
- an applied custom range with both dates preserved in the URL;
- visible billed-revenue and payments-collected totals;
- the absence of revenue mutation controls;
- desktop and mobile rendering; and
- no page-level horizontal overflow.

The final result is shown with screenshots of the signed-in interface.
