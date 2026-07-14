# Job Flow Responsive Shell Polish

**Date:** 2026-07-14

## Goal

Make job creation immediately discoverable from the populated mobile action queue and replace the accidental-looking desktop browser scrollbars with a contained, theme-aware work surface.

## Confirmed Direction

Use the existing guided job desk and live service docket visual language. Do not redesign the workflow, introduce a floating action button, or crowd the global mobile header.

The mobile queue header gains a full-width `New WhatsApp job` action below search. It remains visible with a populated queue and opens the existing `/jobs?mode=new` intake stage. The selected-job view keeps its current action and `Back to jobs` handoff.

At desktop widths, the data-entry shell fills the dynamic viewport and divides the remaining height below the real header instead of subtracting a hard-coded header estimate. The queue and workspace become independent scroll regions only when their own content exceeds the available height. Both use a narrow semantic scrollbar whose track blends into the surface and whose thumb has clear hover contrast in light and dark themes.

## Layout

```text
Mobile queue                 Desktop
+----------------------+     +----------+---------------+-------------------+
| app header           |     | sidebar  | app header                        |
+----------------------+     |          +---------------+-------------------+
| Needs action     (5) |     |          | queue         | active workspace  |
| [ Search jobs      ] |     |          | [Search]      | [New job]         |
| [ + New WhatsApp job]|     |          | jobs          | current stage     |
+----------------------+     |          | scrolls       | scrolls if needed |
| grouped job cards    |     +----------+---------------+-------------------+
| document scroll      |
+----------------------+
```

## Visual System

Reuse the existing semantic palette and typography:

- Primary teal: existing `primary` token for the create action and scrollbar hover state.
- Card and background: existing `card` and `background` tokens for tracks and surfaces.
- Muted graphite: existing `muted` and `muted-foreground` tokens for scrollbar thumbs.
- Border: existing `border` token for pane separation.
- Geist Sans and Geist Mono remain unchanged.

The signature is functional: the mobile queue becomes a complete control surface, while the desktop reads as one fitted operations console rather than a webpage with nested browser chrome.

## Accessibility and Interaction

- The mobile create control keeps the full action label and at least a 44-pixel touch target.
- Keyboard focus continues to use the existing visible ring treatment.
- Scrollbars retain a visible thumb and hover state; they are styled, not hidden.
- Light and dark themes use semantic tokens rather than hard-coded colors.
- The layout remains document-scrolling on mobile and switches to contained pane scrolling only at the desktop breakpoint.

## Testing

Automated regression checks must prove:

- A populated mobile queue includes the `New WhatsApp job` action.
- Desktop sizing no longer relies on `calc(100vh - 105px)`.
- Both desktop scroll panes use the shared themed scrollbar utility.
- Existing queue, stage, theme-token, and mobile back-navigation contracts remain intact.

Browser QA must cover 320, 360, 768, 1024, and 1440 pixel widths in light and dark themes. At mobile widths, verify the action is visible without selecting or emptying the queue and that it opens intake. At desktop widths, verify there is no page-level horizontal overflow, the queue scrolls independently, and the scrollbar visually matches the current theme.

## Scope

This change is limited to the data-entry layout shell, job-flow shell, job action queue, shared scrollbar styling, and their focused tests. It does not change job stages, server actions, permissions, database behavior, financial logic, or navigation outside the data-entry workspace.
