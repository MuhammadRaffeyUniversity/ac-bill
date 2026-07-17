# Optional Team Report Notes Design

## Goal

Allow the data-entry operator to complete the Step 2 team-report workflow without supplying an original WhatsApp update or a closeout note.

## Scope

This change applies to the guided job-flow team report and closeout form. It does not make any outcome or financial controls optional.

The following fields remain required and retain their current validation:

- Work outcome
- Job outcome
- Service amount
- Payment outcome
- Payment rows and reconciliation when required by the payment outcome

## Interface

The labels for `Original WhatsApp update` and `Closeout note` will show `(optional)`. Their HTML `required` and WhatsApp `minLength` constraints will be removed. Supporting copy will explain that the operator may paste the team message when one is available and must still confirm every structured value manually.

No other Step 2 layout or interaction will change.

## Validation and Persistence

The server-side `teamReportCloseoutSchema` will accept either a populated string or a blank string for both fields. Populated closeout notes remain limited to 2,000 characters.

Persistence will preserve the absence of user-supplied content:

- `TeamSubmittedEntry.rawWhatsAppText` receives an empty string when no WhatsApp message is provided because the existing database column is non-nullable.
- Nullable note, job remark, cancellation-reason, and status-history fields receive `null` or are omitted when the closeout note is blank.
- The system will not generate placeholder text such as `Not provided`.

No database migration is required.

## Audit and Business Rules

The initial customer WhatsApp booking remains preserved on the job for audit. This change only affects the optional team completion message recorded during closeout.

The existing deterministic closeout safeguards remain intact. A completed job must still be confirmed as performed, billable completed work must have a positive amount, payment rows must reconcile with the selected payment outcome, and cancelled/no-charge states must remain internally consistent.

## Error Handling

Blank optional fields do not produce validation errors. Existing server errors for stale jobs, inactive team members, invalid outcomes, and inconsistent payment details remain unchanged.

## Testing

Regression tests will prove that:

- The server schema accepts a valid closeout with both text fields blank.
- Populated closeout notes still enforce the 2,000-character limit.
- The form identifies both fields as optional and does not include browser-level required constraints.
- Existing payment and outcome validation tests continue to pass.

Signed-in browser verification will confirm the optional labels and a successful Step 2 submission path with both fields blank while all required structured fields remain enforced.

