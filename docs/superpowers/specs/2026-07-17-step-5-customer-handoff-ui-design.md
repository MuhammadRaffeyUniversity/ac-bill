# Step 5 Customer Handoff UI Design

## Goal

Make the final customer-handoff stage faster to scan and harder to complete incorrectly, while preserving its current invoice, PDF, review, and clipboard behavior.

## User and Job

The user is a Data Entry operator finishing an AC service job. The screen's single job is to confirm the invoice state, provide the customer documents, and prepare the final customer message.

## Chosen Direction

Use a guided handoff manifest inspired by a final service dispatch docket. The interface presents the persisted invoice facts first, then two ordered operator steps:

1. Prepare the customer documents.
2. Send the invoice and feedback links to the customer.

The real sequence justifies numbered structural labels. The design stays dense and operational rather than becoming a document-preview page or a decorative card grid.

## Visual System

- Operations Teal `#147D78`: primary action and completion emphasis.
- Completion Green `#267A64`: ready-state and completed-step cues.
- Signal Amber `#C97918`: unpaid balance emphasis.
- Ink `#17211F`: primary information.
- Mist `#EEF4F2`: quiet grouped surfaces.

These colors map to the existing semantic theme tokens instead of being hard-coded into the component, preserving light and dark themes.

Typography uses:

- Geist Sans for headings, labels, descriptions, and actions.
- Geist Mono for the stage label, invoice number, financial values, and ordered step markers.

The signature element is a slim `Ready to send` completion band tied to the persisted Step 5 state.

## Layout

```text
┌ Customer handoff                         READY TO SEND ┐
│ Invoice INV-…          Total     Paid       Due        │
├────────────────────────────────────────────────────────┤
│ 01  CUSTOMER DOCUMENTS                                │
│     [Open invoice] [Download PDF]                     │
├────────────────────────────────────────────────────────┤
│ 02  SEND TO CUSTOMER                                  │
│     Includes invoice + feedback links                 │
│     [Open review]        [Copy customer message]      │
└────────────────────────────────────────────────────────┘
```

Desktop uses compact horizontal action groups. Mobile stacks each action at full width without horizontal scrolling.

## Components and React Boundary

- `HandoffStage` remains a server component and owns the static invoice summary, payment figures, and customer-document links.
- `CustomerLinkActions` remains the smallest possible client island because only clipboard interaction needs browser state.
- Static values are calculated once in `HandoffStage`; only primitive paths and display values cross component boundaries.
- No effects, data fetching, dynamic imports, or broad client-side state are introduced.

## Behavior

The existing four actions remain:

- Open customer invoice.
- Download PDF.
- Open customer review form.
- Copy customer message containing invoice and feedback links.

`Print Invoice` and `Copy Review` remain absent. Clipboard interaction reports copied and failure states through an accessible live region. No invoice, payment, feedback, permission, or workflow rules change.

## Testing and Verification

- Update the Step 5 source contract to assert the manifest hierarchy and preserved actions.
- Add a focused clipboard-state test where practical without introducing heavy browser mocks.
- Run focused job-flow tests, lint, and TypeScript verification.
- Browser-test a signed-in Step 5 record at desktop and 360-pixel mobile widths.
- Confirm the four intended actions remain visible, the removed actions stay absent, dark/light semantic styling remains legible, and mobile has no horizontal overflow.
- Capture and show the redesigned signed-in interface.

## Scope Boundaries

This change does not alter the action queue, stage persistence, invoice generation, feedback generation, payment calculations, public customer pages, or authorization rules.
